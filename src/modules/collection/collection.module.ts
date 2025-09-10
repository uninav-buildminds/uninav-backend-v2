import { Module } from '@nestjs/common';
import { CollectionService } from './collection.service';
import { CollectionController } from './collection.controller';
import { CollectionRepository } from './collection.repository';
import { DatabaseModule } from '@app/common/modules/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [CollectionController],
  providers: [CollectionService, CollectionRepository],
  exports: [CollectionService],
})
export class CollectionModule {}
