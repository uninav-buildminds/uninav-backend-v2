import { Module } from '@nestjs/common';
import { AdvertService } from './advert.service';
import { AdvertController } from './advert.controller';
import { AdvertRepository } from './advert.repository';
import { DatabaseModule } from '@app/common/modules/database/database.module';
import { StorageModule } from 'src/utils/storage/storage.module';
import { MaterialModule } from 'src/modules/material/material.module';

@Module({
  imports: [DatabaseModule, MaterialModule, StorageModule],
  controllers: [AdvertController],
  providers: [AdvertService, AdvertRepository],
  exports: [AdvertService],
})
export class AdvertModule {}
