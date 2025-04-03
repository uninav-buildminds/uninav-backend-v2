import { Module } from '@nestjs/common';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';
import { CoursesRepository } from './courses.repository';
import { DrizzleModule } from 'src/modules/drizzle/drizzle.module';
import { DepartmentModule } from 'src/modules/department/department.module';

@Module({
  imports: [DrizzleModule, DepartmentModule],
  controllers: [CoursesController],
  providers: [CoursesService, CoursesRepository],
  exports: [CoursesService],
})
export class CoursesModule {}
