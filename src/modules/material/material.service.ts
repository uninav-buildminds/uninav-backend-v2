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
  ApprovalStatus,
  MaterialEntity,
  MaterialTypeEnum,
  ResourceType,
  UserEntity,
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
      const { resourceAddress, metaData, ...materialData } = createMaterialDto;

      // Create material first
      const material = await this.createMaterial(materialData);

      // Create associated resource
      await this.createResource(
        material.id,
        {
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
      resourceAddress?: string;
      metaData?: string[];
      fileKey?: string;
    },
    file?: MulterFile,
  ) {
    try {
      let resourceType: ResourceType;
      let resourceAddress = resourceDto.resourceAddress;
      let fileKey = resourceDto.fileKey;

      // Infer resource type based on input
      if (file) {
        resourceType = ResourceType.UPLOAD;
        const uploadResult = await this.storageService.uploadFile(file, false);
        fileKey = uploadResult.fileKey;
        resourceAddress = await this.storageService.getSignedUrl(
          fileKey,
          3600 * 24 * RESOURCE_ADDRESS_EXPIRY_DAYS,
        );
      } else if (resourceAddress) {
        // Check if it's a Google Drive link
        if (resourceAddress.includes('drive.google.com')) {
          resourceType = ResourceType.GDRIVE;
        } else {
          resourceType = ResourceType.URL;
        }
      } else {
        throw new BadRequestException(
          'Either a file or resource address must be provided',
        );
      }

      const resourceData = {
        materialId,
        resourceAddress,
        resourceType,
        metaData: resourceDto.metaData || [],
        fileKey,
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

  async findAll(filter?: { reviewStatus?: ApprovalStatus }) {
    // Always sort by creation date, newest first
    return this.materialRepository.findAll({
      ...filter,
      orderBy: { createdAt: 'desc' },
    });
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
        this.materialRepository.incrementClicks(id);

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

    // For other resource types (URL, GDRIVE), just return the resource address
    return materialResource.resourceAddress;
  }

  async incrementDownloads(id: string) {
    await this.findOne(id); // Verify material exists
    return this.materialRepository.incrementDownloads(id);
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
      const material = await this.findOne(id);
      await this.ensureOwnership(material, userId);

      const { resourceAddress, metaData, ...materialData } = updateMaterialDto;

      // Handle resource updates if resource data is provided
      if (resourceAddress !== undefined || metaData !== undefined || file) {
        const currentResource =
          await this.materialRepository.findMaterialResource(id);
        let resourceType = currentResource?.resourceType;
        let fileKey = currentResource?.fileKey;

        // Infer resource type and handle file/url
        if (file) {
          resourceType = ResourceType.UPLOAD;
          const uploadResult = await this.storageService.uploadFile(
            file,
            false,
          );
          fileKey = uploadResult.fileKey;
          const signedUrl = await this.storageService.getSignedUrl(
            fileKey,
            3600 * 24 * RESOURCE_ADDRESS_EXPIRY_DAYS,
          );

          // Delete old file if it exists and is an uploaded file
          if (
            currentResource?.resourceType === ResourceType.UPLOAD &&
            currentResource?.fileKey
          ) {
            try {
              await this.storageService.deleteFile(currentResource.fileKey);
            } catch (error) {
              logger.error(
                `Failed to delete old file when updating material: ${error.message}`,
              );
            }
          }

          await this.materialRepository.updateResource(id, {
            resourceAddress: signedUrl,
            resourceType,
            metaData: metaData || currentResource?.metaData,
            fileKey,
          });
        } else if (resourceAddress) {
          // Infer type from resource address
          resourceType = resourceAddress.includes('drive.google.com')
            ? ResourceType.GDRIVE
            : ResourceType.URL;

          await this.materialRepository.updateResource(id, {
            resourceAddress,
            resourceType,
            metaData: metaData || currentResource?.metaData,
          });
        } else if (metaData) {
          // Only updating metadata
          await this.materialRepository.updateResource(id, {
            metaData,
          });
        }
      }

      // Update material data if provided
      if (Object.keys(materialData).length > 0) {
        await this.materialRepository.update(id, materialData);
      }

      // Return updated material with resource
      return this.materialRepository.findOne(id);
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }

      logger.error(`Failed to update material: ${error.message}`);
      throw new InternalServerErrorException('Failed to update material');
    }
  }

  async remove(id: string, userId?: string) {
    // Find material first to ensure it exists
    const material = await this.findOne(id);

    if (userId) {
      // Ensure user is the creator of the material
      await this.ensureOwnership(material, userId);
    }

    // Handle resource deletion if needed
    if (
      material.resource &&
      material.resource.resourceType === ResourceType.UPLOAD
    ) {
      // Delete the file from storage
      try {
        await this.storageService.deleteFile(material.resource.fileKey);
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

  /**
   * Toggle like status for a material
   */
  async likeMaterial(id: string, userId: string) {
    const material = await this.findOne(id);

    if (!material) {
      throw new NotFoundException(`Material with ID ${id} not found`);
    }

    try {
      // Check if the user has already liked this material
      const hasLiked = await this.materialRepository.hasUserLikedMaterial(
        id,
        userId,
      );

      if (hasLiked) {
        // User already liked the material, so unlike it
        await this.materialRepository.removeUserLike(id, userId);
        await this.materialRepository.decrementLikes(id);
        return {
          liked: false,
          message: 'Material unliked successfully',
          likesCount: material.likes - 1,
        };
      } else {
        // User hasn't liked the material yet, so like it
        await this.materialRepository.addUserLike(id, userId);
        const updatedMaterial =
          await this.materialRepository.incrementLikes(id);
        return {
          liked: true,
          message: 'Material liked successfully',
          likesCount: updatedMaterial.likes,
        };
      }
    } catch (error) {
      logger.error(
        `Failed to toggle material like: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to process material like');
    }
  }

  async findByCreator(creatorId: string) {
    return this.materialRepository.findByCreator(creatorId);
  }

  async searchMaterials(
    query: string,
    filters: {
      creatorId?: string;
      courseId?: string;
      type?: any;
      tag?: string;
    },
    user: UserEntity,
    page: number = 1,
  ) {
    if (!query || query.trim().length === 0) {
      throw new BadRequestException('Search query cannot be empty');
    }

    return this.materialRepository.searchMaterials(query, filters, user, page);
  }

  async findWithFilters(
    filters: {
      creatorId?: string;
      courseId?: string;
      type?: string;
      tag?: string;
    },
    page: number = 1,
  ) {
    return this.materialRepository.findWithFilters(
      {
        ...filters,
        type: filters.type as MaterialTypeEnum,
      },
      page,
    );
  }

  async getRecommendations(user: UserEntity, page: number = 1) {
    if (!user.departmentId) {
      throw new BadRequestException(
        'User must have a department to get recommendations',
      );
    }

    return this.materialRepository.getRecommendations(user, page);
  }

  async review(
    materialId: string,
    reviewData: {
      reviewStatus: ApprovalStatus;
      reviewedById: string;
      comment?: string;
    },
  ) {
    const material = await this.materialRepository.findOne(materialId);
    if (!material) {
      throw new NotFoundException('Material not found');
    }

    return this.materialRepository.update(materialId, {
      reviewStatus: reviewData.reviewStatus,
      reviewedById: reviewData.reviewedById,
    });
  }
}
