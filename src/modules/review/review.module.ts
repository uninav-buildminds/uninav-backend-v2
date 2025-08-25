import { Module } from '@nestjs/common';
import { CourseReviewController } from './controllers/course-review.controller';
import { CoursesModule } from '../courses/courses.module';
import { MaterialModule } from '../material/material.module';
import { BlogModule } from '../blog/blog.module';
import { DrizzleModule } from '../drizzle/drizzle.module';
import { DLCReviewController } from 'src/modules/review/controllers/dlc-review.controller';
import { MaterialReviewController } from 'src/modules/review/controllers/material-review.controller';
import { BlogReviewController } from 'src/modules/review/controllers/blog-review.controller';
import { AdvertReviewController } from './controllers/advert-review.controller';
import { AdvertModule } from 'src/modules/advert/advert.module';

@Module({
  imports: [
    DrizzleModule,
    CoursesModule,
    MaterialModule,
    BlogModule,
    AdvertModule,
  ],
  controllers: [
    CourseReviewController,
    DLCReviewController,
    MaterialReviewController,
    BlogReviewController,
    AdvertReviewController,
  ],
})
export class ReviewModule {}
