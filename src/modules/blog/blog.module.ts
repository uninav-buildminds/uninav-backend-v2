import { Module } from '@nestjs/common';
import { BlogService } from './blog.service';
import { BlogController } from './blog.controller';
import { BlogRepository } from './blog.repository';
import { StorageService } from 'src/utils/storage/storage.service';
import { DrizzleModule } from 'src/modules/drizzle/drizzle.module';

@Module({
  imports: [DrizzleModule],
  controllers: [BlogController],
  providers: [BlogService, BlogRepository, StorageService],
  exports: [BlogService],
})
export class BlogModule {}
