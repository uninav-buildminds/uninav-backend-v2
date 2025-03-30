import { Module } from '@nestjs/common';
import { DepartmentService } from './department.service';
import { DepartmentController } from './department.controller';
import { DepartmentRepository } from './department.repository';
import { DrizzleModule } from 'src/drizzle/drizzle.module';
import { FacultyModule } from 'src/faculty/faculty.module';

@Module({
  imports: [DrizzleModule, FacultyModule],
  controllers: [DepartmentController],
  providers: [DepartmentService, DepartmentRepository],
  exports: [DepartmentService],
})
export class DepartmentModule {}
