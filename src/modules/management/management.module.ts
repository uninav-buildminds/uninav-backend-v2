import { Module } from '@nestjs/common';
import { ManagementController } from './management.controller';
import { MaterialModule } from '../material/material.module';
import { BlogModule } from '../blog/blog.module';
import { CoursesModule } from '../courses/courses.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [MaterialModule, BlogModule, CoursesModule, UserModule],
  controllers: [ManagementController],
})
export class ManagementModule {}
