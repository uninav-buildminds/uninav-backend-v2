import { Module } from '@nestjs/common';
import { ClubsService } from './clubs.service';
import { ClubsController } from './clubs.controller';
import { ClubsRepository } from './clubs.repository';
import { StorageModule } from 'src/utils/storage/storage.module';
import { DatabaseModule } from '@app/common/modules/database/database.module';

@Module({
  imports: [DatabaseModule, StorageModule],
  controllers: [ClubsController],
  providers: [ClubsService, ClubsRepository],
  exports: [ClubsService],
})
export class ClubsModule {}
