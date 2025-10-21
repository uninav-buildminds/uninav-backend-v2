import { Logger, Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import * as multer from 'multer';
import { MaterialService } from './services/material.service';
import { MaterialController } from './material.controller';
import { MaterialRepository } from './material.repository';
import { DatabaseModule } from '@app/common/modules/database/database.module';
import { StorageModule } from 'src/utils/storage/storage.module';
import { PreviewService } from './services/preview.service';
import { ConfigService } from '@nestjs/config';
import { ENV } from 'src/utils/config/env.enum';

@Module({
  imports: [
    DatabaseModule,
    StorageModule,
    MulterModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        storage: multer.memoryStorage(), // Use memory storage for large files
        limits: {
          fileSize: parseInt(configService.get(ENV.MAX_FILE_SIZE, '524288000')), // 500MB
          files: 1, // Only one file at a time
        },
        fileFilter: (req, file, cb) => {
          // Basic file type validation - detailed validation happens in storage service
          const allowedMimeTypes = [
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
            'application/x-rar-compressed',
            'application/x-7z-compressed',
            'video/mp4',
            'video/avi',
            'video/quicktime',
            'audio/mpeg',
            'audio/wav',
            'audio/mp4',
          ];

          if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
          } else {
            cb(new Error(`File type ${file.mimetype} is not allowed`), false);
          }
        },
      }),
    }),
  ],
  controllers: [MaterialController],
  providers: [MaterialService, MaterialRepository, PreviewService],
  exports: [MaterialService],
})
export class MaterialModule {}

export const materialLogger = new Logger(MaterialModule.name);
