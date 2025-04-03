import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { MaterialRepository } from './material.repository';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';
import { StorageService } from 'src/storage/storage.service';
import {
  MaterialEntity,
  MaterialTypeEnum,
  ResourceType,
} from 'src/utils/types/db.types';
import { MulterFile } from 'src/utils/types';
import { materialLogger as logger } from 'src/modules/material/material.module';
import {
  RESOURCE_ADDRESS_EXPIRY_DAYS,
  RESOURCE_DOWNLOAD_URL_EXPIRY_DAYS,
} from 'src/utils/config/constants.config';
import * as moment from 'moment-timezone';
('updateMaterialDto');

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
  async findMaterialResource(id: string) {
    const resource = await this.materialRepository.findMaterialResource(id);
    if (!resource) {
      throw new NotFoundException('Resource not found');
    }
    return resource;
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

  /**
   * Ensures the user is authorized to modify the material
   * @param materialId Material ID to check
   * @param userId User ID to verify against
   * @throws ForbiddenException if user is not the creator
   */
  async ensureOwnership(
    material: MaterialEntity,
    userId: string,
  ): Promise<void> {
    const isOwner = material.creatorId === userId;
    if (!isOwner) {
      logger.warn(
        `User ${userId} attempted to modify material ${material.id} without ownership`,
      );
      throw new ForbiddenException(
        'You do not have permission to modify this material',
      );
    }
  }

  async update(
    id: string,
    updateMaterialDto: UpdateMaterialDto,
    userId: string,
    file?: MulterFile,
  ) {
    try {
      const material = await this.findOne(id); // Check if exists

      // Ensure user is the creator of the material
      await this.ensureOwnership(material, userId);

      // Extract and separate resource data from material data
      const { resourceType, resourceAddress, metaData, ...materialData } =
        updateMaterialDto;

      // Handle resource updates if resource data is provided
      if (
        resourceType !== undefined ||
        resourceAddress !== undefined ||
        metaData !== undefined
      ) {
        const currentResource =
          await this.materialRepository.findMaterialResource(id);

        // Prepare resource update data
        let resourceDto = {
          resourceType: resourceType || currentResource?.resourceType,
          resourceAddress: resourceAddress,
          metaData: metaData || currentResource?.metaData,
          fileKey: currentResource?.fileKey,
        };

        // Handle file uploads for ResourceType.UPLOAD
        if (resourceType === ResourceType.UPLOAD) {
          if (!file) {
            throw new BadRequestException(
              'File upload is required for uploaded resources',
            );
          }

          // Upload the new file
          const { publicUrl, fileKey } = await this.storageService.uploadFile(
            file,
            false,
          );
          const signedUrl = await this.storageService.getSignedUrl(
            fileKey,
            3600 * 24 * RESOURCE_ADDRESS_EXPIRY_DAYS,
          );
          resourceDto.resourceAddress = signedUrl;
          resourceDto.fileKey = fileKey;

          // Delete the old file if it exists and is an uploaded file
          if (
            currentResource?.resourceType === ResourceType.UPLOAD &&
            currentResource?.fileKey
          ) {
            try {
              await this.storageService.deleteFile(
                currentResource.fileKey,
                false,
              );
            } catch (error) {
              logger.error(
                `Failed to delete old file when updating material: ${error.message}`,
              );
              // Continue with update even if file deletion fails
            }
          }
        } else if (resourceType && !resourceAddress) {
          // If changing resource type but no address provided
          throw new BadRequestException(
            'Resource address is required when changing resource type',
          );
        }

        // Update the resource
        await this.materialRepository.updateResource(id, resourceDto);
      }

      if (Object.values(materialData).length !== 0) {
        await this.materialRepository.update(id, materialData);
      }

      // Return the updated material with its resource
      return this.materialRepository.findOne(id);
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error; // Re-throw specific exceptions
      }

      logger.error(`Failed to update material: ${error.message}`);
      throw new InternalServerErrorException('Failed to update material');
    }
  }

  async remove(id: string, userId: string) {
    // Find material first to ensure it exists
    const material = await this.findOne(id);

    // Ensure user is the creator of the material
    await this.ensureOwnership(material, userId);

    // Handle resource deletion if needed
    if (
      material.resource &&
      material.resource.resourceType === ResourceType.UPLOAD
    ) {
      // Delete the file from storage
      try {
        await this.storageService.deleteFile(material.resource.fileKey, false);
        logger.log(
          `Successfully deleted file ${material.resource.fileKey} when removing material ${id}`,
        );
      } catch (error) {
        logger.error(
          `Failed to delete file when removing material: ${error.message}`,
        );
        // Continue with the deletion even if file deletion fails
      }
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

  async findWithFilters(filters: {
    creatorId?: string;
    courseId?: string;
    type?: string;
    tag?: string;
  }) {
    return this.materialRepository.findWithFilters({
      ...filters,
      type: filters.type as MaterialTypeEnum,
    });
  }
}
