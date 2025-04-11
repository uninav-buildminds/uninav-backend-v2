import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  ForbiddenException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { AdvertRepository } from './advert.repository';
import { CreateFreeAdvertDto } from './dto/create-free-advert.dto';
import { StorageService } from 'src/storage/storage.service';
import { MulterFile } from 'src/utils/types';
import {
  AdvertEntity,
  MaterialEntity,
  ApprovalStatus,
} from 'src/utils/types/db.types';
import { ADVERT_IMAGE_URL_EXPIRY_DAYS } from 'src/utils/config/constants.config';
import * as moment from 'moment-timezone';
import { MaterialService } from 'src/modules/material/material.service';

@Injectable()
export class AdvertService {
  private readonly logger = new Logger(AdvertService.name);

  constructor(
    private readonly advertRepository: AdvertRepository,
    private readonly storageService: StorageService,
    private readonly materialService: MaterialService,
  ) {}

  async createFreeAd(
    createAdvertDto: CreateFreeAdvertDto,
    image: MulterFile,
  ): Promise<AdvertEntity> {
    try {
      if (createAdvertDto.materialId) {
        let material = await this.materialService.findOne(
          createAdvertDto.materialId,
        );
        if (!material) {
          throw new BadRequestException(
            `Material with ID ${createAdvertDto.materialId} not found`,
          );
        }
        if (material.creatorId !== createAdvertDto.creatorId) {
          throw new ForbiddenException(
            'You do not have permission to create an advert for this material',
          );
        }
      } else if (createAdvertDto.collectionId) {
        // !handle later
      } else {
        throw new BadRequestException(
          'Material ID or Collection ID must be provided',
        );
      }

      // Upload image to storage
      const { fileKey } = await this.storageService.uploadFile(
        image,
        true, // isMedia = true since it's an image
      );

      // Generate initial signed URL
      const imageUrl = await this.storageService.getSignedUrl(
        fileKey,
        3600 * 24 * ADVERT_IMAGE_URL_EXPIRY_DAYS, // 7 days expiration
        false,
        'media',
      );

      // Create advert with image URL and fileKey
      const advert = await this.advertRepository.create({
        ...createAdvertDto,
        imageUrl,
        fileKey,
      });

      return advert;
    } catch (error) {
      this.logger.error(
        `Failed to create advert: ${error.message}`,
        createAdvertDto,
      );
      throw new InternalServerErrorException('Failed to create advert');
    }
  }

  async findAll(): Promise<AdvertEntity[]> {
    const adverts = await this.advertRepository.findAll();
    return await this.refreshExpiredUrls(adverts);
  }

  async findOne(id: string): Promise<AdvertEntity> {
    const advert = await this.advertRepository.findOne(id);
    if (!advert) {
      throw new BadRequestException(`Advert with ID ${id} not found`);
    }

    // Check if the image URL has expired
    const isExpired = moment(advert.updatedAt).isBefore(
      moment().subtract(ADVERT_IMAGE_URL_EXPIRY_DAYS, 'days'),
    );

    if (isExpired) {
      // Generate new signed URL
      const newImageUrl = await this.storageService.getSignedUrl(
        advert.fileKey,
        3600 * 24 * ADVERT_IMAGE_URL_EXPIRY_DAYS,
        false,
        'media',
      );

      // Update advert with new URL
      await this.advertRepository.update(id, {
        imageUrl: newImageUrl,
      });

      advert.imageUrl = newImageUrl;
    }

    await this.trackView(id);
    return advert;
  }

  async findByMaterial(materialId: string): Promise<AdvertEntity[]> {
    const adverts = await this.advertRepository.findByMaterial(materialId);
    return await this.refreshExpiredUrls(adverts);
  }

  async findByCollection(collectionId: string): Promise<AdvertEntity[]> {
    const adverts = await this.advertRepository.findByCollection(collectionId);
    return await this.refreshExpiredUrls(adverts);
  }

  async findByCreator(creatorId: string): Promise<AdvertEntity[]> {
    try {
      return await this.advertRepository.findByCreator(creatorId);
    } catch (error) {
      this.logger.error(`Failed to fetch adverts by creator: ${error.message}`);
      throw new InternalServerErrorException(
        'Failed to fetch adverts by creator',
      );
    }
  }

  async trackView(id: string): Promise<void> {
    await this.advertRepository.incrementViews(id);
  }

  async trackClick(id: string): Promise<void> {
    await this.advertRepository.incrementClicks(id);
  }

  async update(
    id: string,
    updateAdvertDto: Partial<CreateFreeAdvertDto>,
    userId: string,
    image?: MulterFile,
  ) {
    try {
      const advert = await this.findOne(id);

      // Check if user owns this advert
      if (advert.creatorId !== userId) {
        throw new ForbiddenException(
          'You do not have permission to modify this advert',
        );
      }

      const updateData: any = { ...updateAdvertDto };

      if (image) {
        // Upload new image
        const { fileKey } = await this.storageService.uploadFile(image, true);

        // Generate new signed URL
        const imageUrl = await this.storageService.getSignedUrl(
          fileKey,
          3600 * 24 * ADVERT_IMAGE_URL_EXPIRY_DAYS,
          false,
          'media',
        );

        // Delete old image if exists
        if (advert.fileKey) {
          try {
            await this.storageService.deleteFile(advert.fileKey);
          } catch (error) {
            this.logger.error(`Failed to delete old image: ${error.message}`);
          }
        }

        updateData.imageUrl = imageUrl;
        updateData.fileKey = fileKey;
      }

      await this.advertRepository.update(id, updateData);
      return this.findOne(id);
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      this.logger.error(`Failed to update advert: ${error.message}`);
      throw new InternalServerErrorException('Failed to update advert');
    }
  }

  async remove(id: string, userId: string): Promise<AdvertEntity> {
    try {
      const advert = await this.findOne(id);

      // Check if user owns this advert
      if (advert.creatorId !== userId) {
        throw new ForbiddenException(
          'You do not have permission to delete this advert',
        );
      }

      // Delete image from storage if exists
      if (advert.fileKey) {
        try {
          await this.storageService.deleteFile(advert.fileKey);
        } catch (error) {
          this.logger.error(`Failed to delete advert image: ${error.message}`);
          // Continue with deletion even if image deletion fails
        }
      }

      return this.advertRepository.remove(id);
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      this.logger.error(`Failed to delete advert: ${error.message}`);
      throw new InternalServerErrorException('Failed to delete advert');
    }
  }

  private async refreshExpiredUrls(
    adverts: AdvertEntity[],
  ): Promise<AdvertEntity[]> {
    const refreshedAdverts = await Promise.all(
      adverts.map(async (advert) => {
        const isExpired = moment(advert.updatedAt).isBefore(
          moment().subtract(ADVERT_IMAGE_URL_EXPIRY_DAYS, 'days'),
        );

        if (isExpired) {
          // Generate new signed URL
          const newImageUrl = await this.storageService.getSignedUrl(
            advert.fileKey,
            3600 * 24 * ADVERT_IMAGE_URL_EXPIRY_DAYS,
            false,
            'media',
          );

          // Update advert with new URL
          await this.advertRepository.update(advert.id, {
            imageUrl: newImageUrl,
          });

          return { ...advert, imageUrl: newImageUrl };
        }

        return advert;
      }),
    );

    return refreshedAdverts;
  }

  async findAllPaginated(options: {
    reviewStatus?: ApprovalStatus;
    page?: number;
  }) {
    try {
      return await this.advertRepository.findAllPaginated(options);
    } catch (error) {
      this.logger.error(`Failed to fetch paginated adverts: ${error.message}`);
      throw new InternalServerErrorException('Failed to fetch adverts');
    }
  }

  async countAdvertsByStatus(departmentId?: string) {
    try {
      return await this.advertRepository.countByStatus(departmentId);
    } catch (error) {
      this.logger.error(`Failed to get adverts count: ${error.message}`);
      throw new InternalServerErrorException('Failed to get adverts count');
    }
  }

  async review(
    id: string,
    reviewData: {
      reviewStatus: ApprovalStatus;
      reviewedById: string;
    },
  ) {
    const advert = await this.findOne(id);
    if (!advert) {
      throw new NotFoundException('Advertisement not found');
    }

    await this.advertRepository.update(id, {
      reviewStatus: reviewData.reviewStatus,
      reviewedById: reviewData.reviewedById,
    });

    return this.findOne(id);
  }
}
