import { Module } from '@nestjs/common';
import { DepartmentService } from './department.service';
import { DepartmentController } from './department.controller';
import { DepartmentRepository } from './department.repository';
import { DrizzleModule } from 'src/modules/drizzle/drizzle.module';
import { FacultyModule } from 'src/modules/faculty/faculty.module';

@Module({
  imports: [DrizzleModule, FacultyModule],
  controllers: [DepartmentController],
  providers: [DepartmentService, DepartmentRepository],
  exports: [DepartmentService],
})
export class DepartmentModule {}
