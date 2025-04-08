import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { AdvertRepository } from './advert.repository';
import { CreateFreeAdvertDto } from './dto/create-advert.dto';
import { StorageService } from 'src/storage/storage.service';
import { MulterFile } from 'src/utils/types';
import { AdvertEntity } from 'src/utils/types/db.types';
import { Logger } from '@nestjs/common';
import { ADVERT_IMAGE_URL_EXPIRY_DAYS } from 'src/utils/config/constants.config';
import * as moment from 'moment-timezone';

@Injectable()
export class AdvertService {
  private readonly logger = new Logger(AdvertService.name);

  constructor(
    private readonly advertRepository: AdvertRepository,
    private readonly storageService: StorageService,
  ) {}

  async create(
    createAdvertDto: CreateFreeAdvertDto,
    image: MulterFile,
  ): Promise<AdvertEntity> {
    try {
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
      this.logger.error(`Failed to create advert: ${error.message}`);
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

  async trackView(id: string): Promise<void> {
    await this.advertRepository.incrementViews(id);
  }

  async trackClick(id: string): Promise<void> {
    await this.advertRepository.incrementClicks(id);
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
}
