import { Module } from '@nestjs/common';
import { CollectionService } from './collection.service';
import { CollectionController } from './collection.controller';
import { CollectionRepository } from './collection.repository';
import { DrizzleModule } from 'src/modules/drizzle/drizzle.module';

@Module({
  imports: [DrizzleModule],
  controllers: [CollectionController],
  providers: [CollectionService, CollectionRepository],
  exports: [CollectionService],
})
export class CollectionModule {}
