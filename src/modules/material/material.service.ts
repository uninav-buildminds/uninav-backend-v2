import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { MaterialRepository } from './material.repository';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';
import { StorageService } from 'src/storage/storage.service';
import { MaterialTypeEnum, ResourceType } from 'src/utils/types/db.types';
import { MulterFile } from 'src/utils/types';
import { materialLogger as logger } from 'src/modules/material/material.module';
import {
  RESOURCE_ADDRESS_EXPIRY_DAYS,
  RESOURCE_DOWNLOAD_URL_EXPIRY_DAYS,
} from 'src/utils/config/constants.config';
import * as moment from 'moment-timezone';
@Injectable()
export class MaterialService {
  constructor(
    private readonly materialRepository: MaterialRepository,
    private readonly storageService: StorageService,
  ) {}

  async create(createMaterialDto: CreateMaterialDto, file?: MulterFile) {
    try {
      const { resourceType, resourceAddress, metaData, ...materialData } =
        createMaterialDto;

      // Create material first
      const material = await this.createMaterial(materialData);

      // Create associated resource
      await this.createResource(
        material.id,
        {
          resourceType,
          resourceAddress,
          metaData,
        },
        file,
      );

      // Return complete material with resource
      const materialWithResource = await this.materialRepository.findOne(
        material.id,
      );
      return materialWithResource;
    } catch (error) {
      logger.error(`Failed to create material with resource: ${error.message}`);
      throw new InternalServerErrorException(
        'Failed to create material with resource',
      );
    }
  }

  private async createResource(
    materialId: string,
    resourceDto: {
      resourceType: ResourceType;
      resourceAddress?: string;
      metaData?: string[];
      fileKey?: string;
    },
    file?: MulterFile,
  ) {
    try {
      // Validate resource data based on resourceType
      if (resourceDto.resourceType === ResourceType.UPLOAD) {
        if (!file) {
          throw new BadRequestException(
            'File is required for uploaded resources',
          );
        }
        const { publicUrl, fileKey } = await this.storageService.uploadFile(
          file,
          false,
        );
        const signedUrl = await this.storageService.getSignedUrl(
          fileKey,
          3600 * 24 * RESOURCE_ADDRESS_EXPIRY_DAYS, // 7 days expiration
        );
        resourceDto.resourceAddress = signedUrl;
        resourceDto.fileKey = fileKey;
      } else if (!resourceDto.resourceAddress) {
        throw new BadRequestException(
          'Resource address is required for URL and GDrive resources',
        );
      }

      const resourceData = {
        materialId,
        resourceAddress: resourceDto.resourceAddress,
        resourceType: resourceDto.resourceType,
        metaData: resourceDto.metaData || [],
        fileKey: resourceDto.fileKey,
      };

      return await this.materialRepository.createResource(resourceData);
    } catch (error) {
      logger.error(`Failed to create resource: ${error.message}`);
      throw new InternalServerErrorException('Failed to create resource');
    }
  }

  private async createMaterial(
    materialData: Omit<
      CreateMaterialDto,
      'resourceType' | 'resourceAddress' | 'metaData'
    >,
  ) {
    try {
      return await this.materialRepository.create(materialData);
    } catch (error) {
      logger.error(`Failed to create material: ${error.message}`);
      throw new InternalServerErrorException('Failed to create material');
    }
  }

  async findAll() {
    return this.materialRepository.findAll();
  }

  async findOne(id: string) {
    const material = await this.materialRepository.findOne(id);
    if (!material) {
      throw new NotFoundException(`Material with id ${id} not found`);
    }
    return material;
  }

  async getMaterial(id: string) {
    const material = await this.findOne(id);

    // Get the associated resource
    const materialWithResource = await this.materialRepository.findOne(id);
    if (!materialWithResource?.resource) {
      throw new NotFoundException(`Resource for material id ${id} not found`);
    }

    const { resource: materialResource } = materialWithResource;

    // For uploaded resources, generate a signed URL
    if (materialResource.resourceType === ResourceType.UPLOAD) {
      // ? Check if resourceAddress link has expired
      const isExpired = moment(material.resource.updatedAt).isBefore(
        moment().subtract(RESOURCE_ADDRESS_EXPIRY_DAYS, 'days'),
      );
      if (isExpired) {
        let fileKey = materialResource.fileKey;
        // Generate a signed URL for the file
        const signedUrl = await this.storageService.getSignedUrl(
          fileKey,
          3600 * 24 * RESOURCE_ADDRESS_EXPIRY_DAYS, // 7 days expiration
          false,
        );
        this.materialRepository.updateResource(id, {
          resourceAddress: signedUrl,
        });
        this.materialRepository.incrementClickCount(id);

        material.resource.resourceAddress = signedUrl; // Update the resource address in the material
      }
    }

    return material;
  }

  async getDownloadUrl(id: string) {
    const material = await this.findOne(id);

    // Get the associated resource
    const materialWithResource = await this.materialRepository.findOne(id);
    if (!materialWithResource?.resource) {
      throw new NotFoundException(`Resource for material id ${id} not found`);
    }

    const { resource: materialResource } = materialWithResource;

    // For uploaded resources, generate a signed URL
    if (materialResource.resourceType === ResourceType.UPLOAD) {
      // Generate a signed URL for the file
      const signedUrl = await this.storageService.getSignedUrl(
        materialResource.fileKey,
        3600 * 24 * RESOURCE_DOWNLOAD_URL_EXPIRY_DAYS, // 7 days expiration
        true,
      );
      return signedUrl;
    }
  }

  async update(
    id: string,
    updateMaterialDto: UpdateMaterialDto,
    file?: MulterFile,
  ) {
    const material = await this.findOne(id); // Check if exists
    if (!material) {
      throw new NotFoundException(`Material with id ${id} wasn't found`);
    }

    // Extract and handle resource data if present
    if (updateMaterialDto.resourceAddress) {
      const { resourceAddress, resourceType, metaData, ...materialData } =
        updateMaterialDto;
      let resourceDto = {
        resourceAddress,
        resourceType,
        metaData,
        fileKey: null,
      };

      // Handle file upload if resource type is UPLOADED and file is provided
      if (resourceDto?.resourceType === ResourceType.UPLOAD && file) {
        const { publicUrl, fileKey } = await this.storageService.uploadFile(
          file,
          false,
        );
        resourceDto.resourceAddress = publicUrl;
        resourceDto.fileKey = fileKey;
        // Update the resource
        if (resourceDto) {
          const resourceUpdateData: any = {};
          if (resourceDto.resourceAddress)
            resourceUpdateData.resourceAddress = resourceDto.resourceAddress;
          if (resourceDto.resourceType)
            resourceUpdateData.resourceType = resourceDto.resourceType;
          if (resourceDto.metaData)
            resourceUpdateData.metaData = resourceDto.metaData;

          await this.materialRepository.updateResource(id, resourceUpdateData);
        }

        // Update material
        return this.materialRepository.update(id, materialData);
      }
    }

    // If no resource data, just update the material
    return this.materialRepository.update(id, updateMaterialDto);
  }

  async remove(id: string) {
    // Find material first to ensure it exists
    const material = await this.findOne(id);

    // Handle resource deletion if needed
    if (
      material.resource &&
      material.resource.resourceType === ResourceType.UPLOAD
    ) {
      // Extract filename from resource URL
      const fileKey = material.resource.fileKey;

      // Delete the file from S3
      await this.storageService.deleteFile(fileKey, false);
    }

    return this.materialRepository.remove(id);
  }

  async likeMaterial(id: string) {
    await this.findOne(id); // Check if exists
    return this.materialRepository.incrementLikes(id);
  }

  async findByCreator(creatorId: string) {
    return this.materialRepository.findByCreator(creatorId);
  }

  async findByType(type: string) {
    return this.materialRepository.findByType(type as MaterialTypeEnum);
  }
}
