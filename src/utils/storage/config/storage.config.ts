import { ConfigService } from '@nestjs/config';
import { ENV } from '../../config/env.enum';

export const createStorageConfig = (configService: ConfigService) => ({
  provider:
    (configService.get('STORAGE_PROVIDER') as 'idrive' | 'cloudinary') ||
    'idrive',
  maxFileSize: parseInt(configService.get(ENV.MAX_FILE_SIZE, '524288000')), // 500MB
  allowedMimeTypes: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/markdown',
    'application/zip',
    'application/x-zip-compressed',
  ],
  idrive: {
    endpoint: configService.get(ENV.IDRIVE_ENDPOINT),
    region: configService.get(ENV.IDRIVE_REGION),
    accessKeyId: configService.get(ENV.IDRIVE_ACCESS_KEY),
    secretAccessKey: configService.get(ENV.IDRIVE_SECRET_KEY),
    publicBucket: configService.get(ENV.IDRIVE_PUBLIC_BUCKET),
    privateBucket: configService.get(ENV.IDRIVE_PRIVATE_BUCKET),
  },
  cloudinary: {
    cloudName: configService.get(ENV.CLOUDINARY_CLOUD_NAME),
    apiKey: configService.get(ENV.CLOUDINARY_API_KEY),
    apiSecret: configService.get(ENV.CLOUDINARY_API_SECRET),
    secure: configService.get(ENV.CLOUDINARY_SECURE, 'true') === 'true',
  },
});

export type StorageConfig = ReturnType<typeof createStorageConfig>;
