import { Module } from '@nestjs/common';
import { CourseReviewController } from './controllers/course-review.controller';
import { DLCReviewController } from './controllers/dlc-review.controller';
import { MaterialReviewController } from './controllers/material-review.controller';
import { BlogReviewController } from './controllers/blog-review.controller';
import { CoursesModule } from '../courses/courses.module';
import { MaterialModule } from '../material/material.module';
import { BlogModule } from '../blog/blog.module';
import { DrizzleModule } from '../drizzle/drizzle.module';
import { EmailModule } from '../../utils/email/email.module';

@Module({
  imports: [
    DrizzleModule,
    CoursesModule,
    MaterialModule,
    BlogModule,
    EmailModule,
  ],
  controllers: [
    CourseReviewController,
    DLCReviewController,
    MaterialReviewController,
    BlogReviewController,
  ],
})
export class ReviewModule {}
