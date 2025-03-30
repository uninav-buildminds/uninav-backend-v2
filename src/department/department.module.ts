import { Module } from '@nestjs/common';
import { DepartmentService } from './department.service';
import { DepartmentController } from './department.controller';
import { DepartmentRepository } from './department.repository';
import { DrizzleModule } from 'src/drizzle/drizzle.module';
import { FacultyModule } from 'src/faculty/faculty.module';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [DrizzleModule, FacultyModule, UserModule],
  controllers: [DepartmentController],
  providers: [DepartmentService, DepartmentRepository],
  exports: [DepartmentService],
})
export class DepartmentModule {}
