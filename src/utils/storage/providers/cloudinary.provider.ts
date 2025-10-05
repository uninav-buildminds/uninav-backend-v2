import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import {
  IStorageProvider,
  MulterFile,
  UploadOptions,
  UploadResult,
} from '../interfaces/storage.interface';

@Injectable()
export class CloudinaryProvider implements IStorageProvider {
  constructor(private configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get('CLOUDINARY_API_SECRET'),
      secure: this.configService.get('CLOUDINARY_SECURE', 'true') === 'true',
    });
  }

  async uploadFile(
    file: MulterFile,
    options: UploadOptions,
  ): Promise<UploadResult> {
    const fileName =
      options.fileName || this.generateFileName(file.originalname);
    const folder = options.folder || 'uploads';

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          public_id: `${folder}/${fileName}`,
          resource_type: this.getResourceType(file.mimetype),
          folder: folder,
          use_filename: false,
          unique_filename: true,
        },
        (error, result) => {
          if (error) {
            reject(error);
            return;
          }

          if (!result) {
            reject(new Error('Upload failed - no result returned'));
            return;
          }

          resolve({
            fileKey: result.public_id,
            url: result.secure_url,
            size: result.bytes,
            mimeType: file.mimetype,
            originalName: file.originalname,
            bucketType: 'public', // Cloudinary assets are public by design
            uploadedAt: new Date(),
          });
        },
      );

      uploadStream.end(file.buffer);
    });
  }

  async getSignedFileUrl(
    fileKey: string,
    bucket: string,
    expiresIn = 3600,
  ): Promise<string> {
    // Cloudinary doesn't use signed URLs in the traditional sense
    // Instead, we can generate a signed URL using Cloudinary's URL signing
    const timestamp = Math.round(new Date().getTime() / 1000) + expiresIn;
    const signature = cloudinary.utils.api_sign_request(
      {
        public_id: fileKey,
        timestamp: timestamp,
      },
      this.configService.get('CLOUDINARY_API_SECRET'),
    );

    return cloudinary.url(fileKey, {
      sign_url: true,
      timestamp: timestamp,
      signature: signature,
    });
  }

  getPublicFileUrl(fileKey: string, bucket: string): string {
    return cloudinary.url(fileKey, {
      secure: this.configService.get('CLOUDINARY_SECURE', 'true') === 'true',
    });
  }

  async deleteFile(fileKey: string, bucket: string): Promise<void> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.destroy(fileKey, (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  }

  private generateFileName(originalName: string): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = originalName.split('.').pop();
    return `${timestamp}-${randomString}.${extension}`;
  }

  private getResourceType(
    mimeType: string,
  ): 'image' | 'video' | 'raw' | 'auto' {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'raw';
    if (mimeType === 'application/pdf') return 'raw';
    return 'auto';
  }
}
