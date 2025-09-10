import { Module } from '@nestjs/common';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';
import { CoursesRepository } from './courses.repository';
import { DatabaseModule } from '@app/common/modules/database/database.module';
import { DepartmentModule } from 'src/modules/department/department.module';

@Module({
  imports: [DatabaseModule, DepartmentModule],
  controllers: [CoursesController],
  providers: [CoursesService, CoursesRepository],
  exports: [CoursesService, CoursesRepository],
})
export class CoursesModule {}
