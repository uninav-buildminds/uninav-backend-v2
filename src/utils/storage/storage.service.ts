import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  IStorageProvider,
  MulterFile,
  StorageProviderType,
} from './interfaces/storage.interface';
import { createStorageConfig } from './config/storage.config';
import { IDriveProvider } from './providers/idrive.provider';
import { CloudinaryProvider } from './providers/cloudinary.provider';

@Injectable()
export class StorageService {
  private storageConfig = createStorageConfig(this.configService);
  private logger = new Logger(StorageService.name);
  private providers: Record<StorageProviderType, IStorageProvider>;

  constructor(private configService: ConfigService) {
    // Eagerly initialize providers once
    this.providers = {
      idrive: new IDriveProvider(this.configService),
      cloudinary: new CloudinaryProvider(this.configService),
    };
  }

  private getProvider(provider?: StorageProviderType): IStorageProvider {
    const key = provider || this.storageConfig.provider;
    return this.providers[key];
  }

  // Upload file with validation and provider selection
  async uploadFile(
    file: MulterFile,
    options: {
      fileName?: string;
      folder?: string;
      bucketType?: 'public' | 'private';
      provider?: StorageProviderType;
    } = {},
  ): Promise<{
    fileKey: string;
    url: string;
    size: number;
    mimeType: string;
    originalName: string;
    bucketType: 'public' | 'private';
  }> {
    this.logger.log('Starting file upload', {
      originalName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      bucketType: options.bucketType || 'private',
      provider: options.provider || this.storageConfig.provider,
    });

    // Validate file
    this.validateFile(file);

    // Generate unique file name if not provided
    const fileName =
      options.fileName || this.generateFileName(file.originalname);

    // Always store under documents folder for organization
    const baseFolder = 'documents';
    const subFolder = options.folder || 'uploads';
    const folder = `${baseFolder}/${subFolder}`;

    const bucketType = options.bucketType || 'private';

    // Determine bucket based on bucket type and provider
    const bucket = this.getBucketForType(bucketType, options.provider);
    const providerInstance = this.getProvider(options.provider);

    try {
      // Upload to storage provider
      const uploadResult = await providerInstance.uploadFile(file, {
        fileName,
        folder,
        bucket,
      });

      this.logger.log('File uploaded successfully', {
        fileKey: uploadResult.fileKey,
        bucketType,
        size: uploadResult.size,
      });

      return {
        fileKey: uploadResult.fileKey,
        url: uploadResult.url,
        size: uploadResult.size,
        mimeType: uploadResult.mimeType,
        originalName: uploadResult.originalName,
        bucketType: bucketType,
      };
    } catch (error) {
      this.logger.error('Failed to upload file', error, {
        originalName: file.originalname,
        bucketType,
      });
      throw error;
    }
  }

  // Upload blog image with Cloudinary provider for better image handling
  async uploadBlogImage(
    file: MulterFile,
  ): Promise<{ publicUrl: string; fileKey: string }> {
    const result = await this.uploadFile(file, {
      folder: 'media',
      bucketType: 'public',
      provider: 'cloudinary', // Use Cloudinary for images
    });
    return {
      publicUrl: result.url,
      fileKey: result.fileKey,
    };
  }

  // Upload blog content as markdown file
  async uploadBlogContent(
    content: string,
    blogId?: string,
  ): Promise<{ publicUrl: string; fileKey: string }> {
    const fileName = `${blogId || this.generateFileName('content')}-content.md`;

    // Create a mock MulterFile for the content
    const mockFile: MulterFile = {
      fieldname: 'content',
      originalname: fileName,
      encoding: 'utf-8',
      mimetype: 'text/markdown',
      size: Buffer.byteLength(content, 'utf-8'),
      destination: '',
      filename: fileName,
      path: '',
      buffer: Buffer.from(content, 'utf-8'),
    };

    const result = await this.uploadFile(mockFile, {
      fileName,
      folder: 'blogs',
      bucketType: 'public',
    });

    return {
      publicUrl: result.url,
      fileKey: result.fileKey,
    };
  }

  // Update blog content
  async updateBlogContent(
    content: string,
    fileKey: string,
  ): Promise<{ publicUrl: string; fileKey: string }> {
    this.logger.log(`Updating blog content: ${fileKey}`);

    // Create a mock MulterFile for the content
    const mockFile: MulterFile = {
      fieldname: 'content',
      originalname: fileKey.split('/').pop() || 'content.md',
      encoding: 'utf-8',
      mimetype: 'text/markdown',
      size: Buffer.byteLength(content, 'utf-8'),
      destination: '',
      filename: fileKey.split('/').pop() || 'content.md',
      path: '',
      buffer: Buffer.from(content, 'utf-8'),
    };

    const result = await this.uploadFile(mockFile, {
      fileName: fileKey.split('/').pop(),
      folder: 'blogs',
      bucketType: 'public',
    });

    return {
      publicUrl: result.url,
      fileKey: result.fileKey,
    };
  }

  // Get blog content - this would need to be implemented based on the provider
  async getBlogContent(fileKey: string): Promise<string> {
    try {
      // This is a simplified implementation - in a real scenario,
      // you'd need to implement a getFile method in the provider interface
      this.logger.warn(
        'getBlogContent method needs provider-specific implementation',
      );
      throw new Error('getBlogContent not implemented for current provider');
    } catch (error) {
      this.logger.error(`Failed to get blog content: ${error.message}`, error);
      throw error;
    }
  }

  // Get file URL (signed for private, direct for public)
  async getSignedUrl(
    fileKey: string,
    expiry: number,
    bucketType: 'public' | 'private' = 'public',
    provider?: StorageProviderType,
  ): Promise<string> {
    try {
      // Determine bucket based on bucket type
      const bucket = this.getBucketForType(bucketType, provider);
      const providerInstance = this.getProvider(provider);

      // Generate signed URL for all for now
      const signedUrl = await providerInstance.getSignedFileUrl(
        fileKey,
        bucket,
        expiry,
      );

      this.logger.log('Private file access granted', {
        fileKey,
        bucketType,
        expiresIn: expiry,
        signedUrl,
      });

      return signedUrl;
    } catch (error) {
      this.logger.error('Failed to generate file URL', error, {
        fileKey,
        bucketType,
      });
      throw error;
    }
  }

  // Permanently delete file from storage
  async deleteFile(
    fileKey: string,
    bucketType: 'public' | 'private' = 'private',
    provider?: StorageProviderType,
  ): Promise<boolean> {
    if (!fileKey) return true;

    try {
      // Determine bucket based on bucket type
      const bucket = this.getBucketForType(bucketType, provider);
      const providerInstance = this.getProvider(provider);

      await providerInstance.deleteFile(fileKey, bucket);

      this.logger.log('File deleted successfully', {
        fileKey,
        bucketType,
      });

      return true;
    } catch (error) {
      this.logger.error('Failed to delete file', error, {
        fileKey,
        bucketType,
      });
      return false;
    }
  }

  // Private helper methods
  private validateFile(file: MulterFile): void {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (file.size > this.storageConfig.maxFileSize) {
      throw new BadRequestException(
        `File size exceeds maximum allowed size of ${this.storageConfig.maxFileSize} bytes`,
      );
    }

    const allowedTypes = this.storageConfig.allowedMimeTypes;
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `File type ${file.mimetype} is not allowed`,
      );
    }
  }

  private generateFileName(originalName: string): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = originalName.split('.').pop();
    return `${timestamp}-${randomString}.${extension}`;
  }

  // Determine bucket based on bucket type and provider
  private getBucketForType(
    bucketType: 'public' | 'private',
    provider?: StorageProviderType,
  ): string {
    const currentProvider = provider || this.storageConfig.provider;

    switch (currentProvider) {
      case 'idrive':
        return bucketType === 'public'
          ? this.storageConfig.idrive.publicBucket
          : this.storageConfig.idrive.privateBucket;
      case 'cloudinary':
        // Cloudinary doesn't use buckets in the traditional sense
        return 'cloudinary';
      default:
        return bucketType === 'public'
          ? this.storageConfig.idrive.publicBucket
          : this.storageConfig.idrive.privateBucket;
    }
  }

  // Extract file key from a storage URL (e.g. S3 public URL)
  public extractFileKeyFromUrl(url: string): string | null {
    try {
      // Prefer URL parsing to correctly handle paths
      const parsed = new URL(url);
      const pathname = parsed.pathname || '';
      // Remove leading slash
      const key = pathname.startsWith('/') ? pathname.slice(1) : pathname;
      return key || null;
    } catch (error) {
      // Fallback to simple split if URL constructor fails
      try {
        const parts = url.split('/');
        if (parts.length >= 4) {
          return parts.slice(3).join('/');
        }
        return null;
      } catch (fallbackError) {
        this.logger.warn('Failed to extract file key from URL', {
          url,
          error: (fallbackError as Error).message,
        });
        return null;
      }
    }
  }
}
