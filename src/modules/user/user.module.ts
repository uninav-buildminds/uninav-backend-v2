import { Global, Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { UserRepository } from 'src/modules/user/user.repository';
import { DrizzleModule } from 'src/modules/drizzle/drizzle.module';
import { DepartmentModule } from 'src/modules/department/department.module';
import { CoursesModule } from '../courses/courses.module';

@Global()
@Module({
  imports: [DrizzleModule, DepartmentModule, CoursesModule],
  controllers: [UserController],
  providers: [UserService, UserRepository],
  exports: [UserService],
})
export class UserModule {}
