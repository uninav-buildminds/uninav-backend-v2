import { Module } from '@nestjs/common';
import { BlogService } from './blog.service';
import { BlogController } from './blog.controller';
import { BlogRepository } from './blog.repository';
import { StorageModule } from 'src/utils/storage/storage.module';
import { DatabaseModule } from '@app/common/modules/database/database.module';

@Module({
  imports: [DatabaseModule, StorageModule],
  controllers: [BlogController],
  providers: [BlogService, BlogRepository],
  exports: [BlogService],
})
export class BlogModule {}
