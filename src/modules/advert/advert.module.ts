import { Module } from '@nestjs/common';
import { AdvertService } from './advert.service';
import { AdvertController } from './advert.controller';
import { AdvertRepository } from './advert.repository';
import { DatabaseModule } from '@app/common/modules/database/database.module';
import { StorageService } from 'src/utils/storage/storage.service';
import { MaterialModule } from 'src/modules/material/material.module';

@Module({
  imports: [DatabaseModule, MaterialModule],
  controllers: [AdvertController],
  providers: [AdvertService, AdvertRepository, StorageService],
  exports: [AdvertService],
})
export class AdvertModule {}
