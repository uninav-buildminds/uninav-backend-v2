import { Logger, Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import * as multer from 'multer';
import { MaterialService } from './services/material.service';
import { MaterialController } from './material.controller';
import { MaterialRepository } from './material.repository';
import { DatabaseModule } from '@app/common/modules/database/database.module';
import { StorageModule } from 'src/utils/storage/storage.module';
import { PreviewService } from './services/preview.service';

@Module({
  imports: [DatabaseModule, StorageModule],
  controllers: [MaterialController],
  providers: [MaterialService, MaterialRepository, PreviewService],
  exports: [MaterialService],
})
export class MaterialModule {}

export const materialLogger = new Logger(MaterialModule.name);
