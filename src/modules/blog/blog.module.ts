import { Module } from '@nestjs/common';
import { BlogService } from './blog.service';
import { BlogController } from './blog.controller';
import { BlogRepository } from './blog.repository';
import { StorageService } from 'src/utils/storage/storage.service';
import { DatabaseModule } from '@app/common/modules/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [BlogController],
  providers: [BlogService, BlogRepository, StorageService],
  exports: [BlogService],
})
export class BlogModule {}
