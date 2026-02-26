import { Module } from '@nestjs/common';
import { FolderService } from './folder.service';
import { FolderController } from './folder.controller';
import { FolderRepository } from './folder.repository';
import { DatabaseModule } from '@app/common/modules/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [FolderController],
  providers: [FolderService, FolderRepository],
  exports: [FolderService],
})
export class FolderModule {}
