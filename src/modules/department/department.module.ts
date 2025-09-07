import { Module } from '@nestjs/common';
import { DepartmentService } from './department.service';
import { DepartmentController } from './department.controller';
import { DepartmentRepository } from './department.repository';
import { DatabaseModule } from '@app/common/modules/database/database.module';
import { FacultyModule } from 'src/modules/faculty/faculty.module';

@Module({
  imports: [DatabaseModule, FacultyModule],
  controllers: [DepartmentController],
  providers: [DepartmentService, DepartmentRepository],
  exports: [DepartmentService],
})
export class DepartmentModule {}
