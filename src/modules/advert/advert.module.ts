import { Module } from '@nestjs/common';
import { AdvertService } from './advert.service';
import { AdvertController } from './advert.controller';
import { AdvertRepository } from './advert.repository';
import { DrizzleModule } from 'src/modules/drizzle/drizzle.module';
import { StorageService } from 'src/storage/storage.service';
import { MaterialModule } from 'src/modules/material/material.module';

@Module({
  imports: [DrizzleModule, MaterialModule],
  controllers: [AdvertController],
  providers: [AdvertService, AdvertRepository, StorageService],
  exports: [AdvertService],
})
export class AdvertModule {}
