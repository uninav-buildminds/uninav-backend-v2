import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { StorageService } from 'src/utils/storage/storage.service';
import { STORAGE_FOLDERS } from 'src/utils/config/constants.config';

@Injectable()
export class PreviewService {
  private readonly logger = new Logger(PreviewService.name);

  constructor(private readonly storageService: StorageService) {}

  // All preview generation is now done on the frontend.

  // TODO: Add YouTube video preview generation support
  // async generateYouTubePreview(videoUrl: string): Promise<string> {
  //   // Extract video ID from URL
  //   // Use YouTube API to get video thumbnail
  //   // Upload thumbnail to storage
  //   // Return preview URL
  // }

  // Removed: Google Drive parsing and preview generation utilities.

  // Removed: Google Drive downloading logic.

  // Removed: Google Drive metadata retrieval.

  // Removed: Google Drive folder listing.

  // Removed: Google Drive file preview generation.

  /**
   * Upload preview image file to storage
   */
  async uploadPreviewImage(file: any): Promise<string> {
    try {
      const uploadResult = await this.storageService.uploadFile(file, {
        bucketType: 'public',
        folder: STORAGE_FOLDERS.MEDIA,
        provider: 'cloudinary', // Use Cloudinary for preview images
      });

      return uploadResult.url;
    } catch (error) {
      this.logger.error(`Failed to upload preview image: ${error.message}`);
      throw new InternalServerErrorException(
        'Failed to upload preview to storage',
      );
    }
  }

  /**
   * Check if file type is a Google Workspace file
   */
  // Removed: Google Workspace mime-type helpers.
}
