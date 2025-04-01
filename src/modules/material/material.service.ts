import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { MaterialRepository } from './material.repository';
import { CreateMaterialDto, ResourceDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';
import { StorageService } from 'src/storage/storage.service';
import { MaterialTypeEnum, ResourceType } from 'src/utils/types/db.types';
import { MulterFile } from 'src/utils/types';
import { materialLogger as logger } from 'src/modules/material/material.module';
@Injectable()
export class MaterialService {
  constructor(
    private readonly materialRepository: MaterialRepository,
    private readonly storageService: StorageService,
  ) {}

  async create(createMaterialDto: CreateMaterialDto, file?: MulterFile) {
    // Extract resource data from the DTO
    const { resourceType, resourceAddress, ...materialData } =
      createMaterialDto;
    let resourceDto = { resourceType, resourceAddress };
    logger.log({ resourceDto });
    // Validate resource data based on resourceType
    if (resourceDto.resourceType === ResourceType.UPLOADED) {
      if (!file) {
        throw new BadRequestException(
          'File is required for uploaded resources',
        );
      }
      try {
        resourceDto.resourceAddress = await this.storageService.uploadFile(
          file,
          false,
        );
      } catch (error) {
        logger.error(`Failed to upload file: ${error.message}`, error);
        throw new InternalServerErrorException(
          'Failed to upload file. Please try again.',
        );
      }
    } else if (!resourceDto.resourceAddress) {
      // For non-uploaded resources, resourceAddress is required
      throw new BadRequestException(
        'Resource address is required for URL and GDrive resources, attach the resourceAddress',
      );
    }

    const material = await this.materialRepository.create(materialData);

    const resourceData = {
      materialId: material.id,
      resourceAddress: resourceDto.resourceAddress,
      resourceType: resourceDto.resourceType,
      metaData: [], //
    };

    const resource = await this.materialRepository.createResource(resourceData);

    return { ...material, resource };
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

  async getDownloadUrl(id: string, forceDownload = false) {
    const material = await this.findOne(id);

    // Get the associated resource
    const materialWithResource = await this.materialRepository.findOne(id);
    if (!materialWithResource?.resource) {
      throw new NotFoundException(`Resource for material id ${id} not found`);
    }

    const { resource: materialResource } = materialWithResource;

    // For uploaded resources, generate a signed URL
    if (materialResource.resourceType === ResourceType.UPLOADED) {
      // Extract the file key from the resource address
      // We assume the format is https://{endpoint}/{bucket}/{fileKey}
      const resourceUrl = new URL(materialResource.resourceAddress);
      const pathParts = resourceUrl.pathname.split('/');
      const fileKey = pathParts.slice(2).join('/'); // Skip the first empty string and bucket name

      // Generate a signed URL for the file
      const signedUrl = await this.storageService.getSignedUrl(
        fileKey,
        3600,
        forceDownload,
      );

      // Increment download count
      await this.materialRepository.incrementDownloadCount(id);

      return { url: signedUrl, material };
    }

    // For other resource types, just return the resource address
    return { url: materialResource.resourceAddress, material };
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
    let updatedResource;
    if (updateMaterialDto.resourceAddress) {
      const { resourceAddress, resourceType, metaData, ...materialData } =
        updateMaterialDto;
      let resourceDto = { resourceAddress, resourceType, metaData };

      // Handle file upload if resource type is UPLOADED and file is provided
      if (resourceDto?.resourceType === ResourceType.UPLOADED && file) {
        resourceDto.resourceAddress = await this.storageService.uploadFile(
          file,
          false,
        );
      }

      // Update the resource
      if (resourceDto) {
        const resourceUpdateData: any = {};
        if (resourceDto.resourceAddress)
          resourceUpdateData.resourceAddress = resourceDto.resourceAddress;
        if (resourceDto.resourceType)
          resourceUpdateData.resourceType = resourceDto.resourceType;
        if (resourceDto.metaData)
          resourceUpdateData.metaData = resourceDto.metaData;

        updatedResource = await this.materialRepository.updateResource(
          id,
          resourceUpdateData,
        );
      }

      // Update material
      return this.materialRepository.update(id, materialData);
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
      material.resource.resourceType === ResourceType.UPLOADED
    ) {
      // Extract filename from resource URL
      const resourceUrl = new URL(material.resource.resourceAddress);
      const pathParts = resourceUrl.pathname.split('/');
      const fileKey = pathParts.slice(2).join('/');

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
