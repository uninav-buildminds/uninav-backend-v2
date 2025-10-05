import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { MaterialRepository } from 'src/modules/material/material.repository';
import { CreateMaterialDto } from 'src/modules/material/dto/create-material.dto';
import { UpdateMaterialDto } from 'src/modules/material/dto/update-material.dto';
import { StorageService } from 'src/utils/storage/storage.service';
import {
  ApprovalStatus,
  MaterialEntity,
  MaterialTypeEnum,
  ResourceType,
  UserEntity,
  UserRoleEnum,
} from '@app/common/types/db.types';
import { MulterFile } from '@app/common/types';
import { materialLogger as logger } from 'src/modules/material/material.module';
import {
  RESOURCE_ADDRESS_EXPIRY_DAYS,
  RESOURCE_DOWNLOAD_URL_EXPIRY_DAYS,
  STORAGE_FOLDERS,
} from 'src/utils/config/constants.config';
import * as moment from 'moment-timezone';
import { UserService } from 'src/modules/user/user.service';
import { MaterialQueryDto } from '../dto/material-query.dto';
('updateMaterialDto');

@Injectable()
export class MaterialService {
  constructor(
    private readonly materialRepository: MaterialRepository,
    private readonly storageService: StorageService,
    private readonly userService: UserService,
  ) {}

  async countMaterialsByStatus(departmentId?: string) {
    return this.materialRepository.countByStatus(departmentId);
  }

  async updateMaterialPreview(materialId: string, previewUrl: string) {
    try {
      await this.materialRepository.update(materialId, { previewUrl });
      logger.log(
        `Updated material ${materialId} with preview URL: ${previewUrl}`,
      );
      return { success: true, previewUrl };
    } catch (error) {
      logger.error(`Failed to update material preview: ${error.message}`);
      throw new InternalServerErrorException(
        'Failed to update material preview',
      );
    }
  }

  async create(createMaterialDto: CreateMaterialDto, file?: MulterFile) {
    try {
      const { resourceAddress, metaData, ...materialData } = createMaterialDto;

      // Check if creator is admin/moderator and auto-approve if so
      const creator = await this.userService.findOne(
        createMaterialDto.creatorId,
      );
      if (
        creator.role === UserRoleEnum.ADMIN ||
        creator.role === UserRoleEnum.MODERATOR
      ) {
        materialData.reviewStatus = ApprovalStatus.APPROVED;
        materialData.reviewedById = creator.id;
      }

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

      // Increment upload count and allocate upload points (5 points)
      await this.userService.incrementUploadCount(createMaterialDto.creatorId);
      await this.userService.allocateUploadPoints(createMaterialDto.creatorId);

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
      let materialType: MaterialTypeEnum;
      let gdriveMetadata: Record<string, any> | undefined;

      // Infer resource type based on input
      if (file) {
        resourceType = ResourceType.UPLOAD;
        const uploadResult = await this.storageService.uploadFile(file, {
          bucketType: 'private', // Store sensitive materials in private bucket
          folder: STORAGE_FOLDERS.DOCS,
        });
        fileKey = uploadResult.fileKey;
        resourceAddress = await this.storageService.getSignedUrl(
          fileKey,
          3600 * 24 * RESOURCE_ADDRESS_EXPIRY_DAYS,
          false,
          'private',
        );
      } else if (resourceAddress) {
        // Check if it's a Google Drive link only to set material type
        if (resourceAddress.includes('drive.google.com')) {
          materialType = MaterialTypeEnum.GDRIVE;
        }
        resourceType = ResourceType.URL;
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

      // Update material with type if available
      const materialUpdates: any = {};
      if (materialType) {
        materialUpdates.type = materialType;
      }
      if (gdriveMetadata) {
        materialUpdates.metaData = gdriveMetadata;
      }

      if (Object.keys(materialUpdates).length > 0) {
        await this.materialRepository.update(
          materialId,
          materialUpdates as any,
        );
      }

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

  async getMaterial(id: string, userId?: string) {
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

        material.resource.resourceAddress = signedUrl; // Update the resource address in the material
      }
    }

    // Increment views
    this.materialRepository.incrementViews(id);

    // Track recent view for authenticated users
    if (userId) {
      this.materialRepository.trackRecentView(userId, id);
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
        'private', // Materials are stored in private bucket
      );
      return signedUrl;
    }

    // For other resource types (URL), just return the resource address
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
  async isAuthorized(material: Partial<MaterialEntity>, userId: string) {
    if (material.creatorId !== userId) {
      let user = await this.userService.findOne(userId);
      if (user.role !== UserRoleEnum.ADMIN) {
        throw new ForbiddenException(
          'You are not authorized to perform this action',
        );
      }
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
      await this.isAuthorized(material, userId);

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
          const uploadResult = await this.storageService.uploadFile(file, {
            bucketType: 'private',
            folder: STORAGE_FOLDERS.DOCS,
          });
          fileKey = uploadResult.fileKey;
          const signedUrl = await this.storageService.getSignedUrl(
            fileKey,
            3600 * 24 * RESOURCE_ADDRESS_EXPIRY_DAYS,
            false,
            'private',
          );

          // Delete old file if it exists and is an uploaded file
          if (
            currentResource?.resourceType === ResourceType.UPLOAD &&
            currentResource?.fileKey
          ) {
            try {
              await this.storageService.deleteFile(
                currentResource.fileKey,
                'private', // Materials are stored in private bucket
              );
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
          if (resourceAddress.includes('drive.google.com')) {
            resourceType = ResourceType.URL; // Google Drive links are URLs
            // Also update the material type to GDRIVE
            await this.materialRepository.update(id, {
              type: MaterialTypeEnum.GDRIVE,
            });
          } else {
            resourceType = ResourceType.URL;
          }

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

  async remove(id: string, userId: string) {
    // Find material first to ensure it exists
    const material = await this.findOne(id);

    // Ensure user is the creator of the material
    await this.isAuthorized(material, userId);

    // Handle resource deletion if needed
    if (
      material.resource &&
      material.resource.resourceType === ResourceType.UPLOAD
    ) {
      // Delete the file from storage
      try {
        await this.storageService.deleteFile(
          material.resource.fileKey,
          'private', // Materials are stored in private bucket
        );
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

  async searchMaterial(
    filters: MaterialQueryDto,
    user?: UserEntity,
    includeReviewer?: boolean,
  ) {
    return this.materialRepository.searchMaterial(
      {
        ...filters,
        type: filters.type,
      },
      user,
      includeReviewer,
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

  async getPopularMaterials(limit: number = 10) {
    return this.materialRepository.getPopularMaterials(limit);
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

  async getRecentMaterials(
    user: UserEntity,
    page: number = 1,
    limit: number = 10,
  ) {
    const result = await this.materialRepository.getRecentMaterials(
      user.id,
      page,
      limit,
    );

    return {
      items: result.items,
      pagination: {
        page,
        pageSize: limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
      },
    };
  }

  /**
   * Batch find materials by IDs with optimized database query
   * @param materialIds Array of material IDs to fetch
   * @param userId Optional user ID for tracking views
   */
  async findManyByIds(materialIds: string[], userId?: string) {
    try {
      if (materialIds.length === 0) {
        return [];
      }

      // Use optimized batch query
      const materials =
        await this.materialRepository.findManyByIds(materialIds);

      // Track views if user is provided (batch operation)
      if (userId && materials.length > 0) {
        const validMaterialIds = materials.map((m) => m.id);
        // Run these operations in parallel for better performance
        await Promise.all([
          this.materialRepository.batchIncrementViews(validMaterialIds),
          this.materialRepository.batchTrackRecentViews(
            userId,
            validMaterialIds,
          ),
        ]);
      }

      return materials;
    } catch (error) {
      logger.error(`Failed to batch find materials: ${error.message}`);
      throw new InternalServerErrorException('Failed to retrieve materials');
    }
  }

  /**
   * Track a material download, increment user's download count, and allocate points
   */
  async trackDownload(materialId: string, userId: string): Promise<void> {
    try {
      // Verify material exists
      const material = await this.materialRepository.findOne(materialId);
      if (!material) {
        throw new NotFoundException('Material not found');
      }

      // Increment user's download count and allocate download points (5 points)
      await this.userService.incrementDownloadCount(userId);
      await this.userService.allocateDownloadPoints(userId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      logger.error(`Failed to track download: ${error.message}`);
      throw new InternalServerErrorException('Failed to track download');
    }
  }
}
