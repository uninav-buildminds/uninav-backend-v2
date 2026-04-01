import { Module } from '@nestjs/common';
import { ClubsService } from './clubs.service';
import { ClubsController } from './clubs.controller';
import { ClubsRepository } from './clubs.repository';
import { StorageModule } from 'src/utils/storage/storage.module';
import { DatabaseModule } from '@app/common/modules/database/database.module';
import { CommonModule } from '@app/common/common.module';
import { UserModule } from 'src/modules/user/user.module';

@Module({
  imports: [DatabaseModule, StorageModule, CommonModule, UserModule],
  controllers: [ClubsController],
  providers: [ClubsService, ClubsRepository],
  exports: [ClubsService],
})
export class ClubsModule {}
