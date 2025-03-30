import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { UserRepository } from 'src/user/user.repository';
import { DrizzleModule } from 'src/drizzle/drizzle.module';
import { DepartmentModule } from 'src/department/department.module';

@Module({
  imports: [DrizzleModule, DepartmentModule],
  controllers: [UserController],
  providers: [UserService, UserRepository],
  exports: [UserService],
})
export class UserModule {}
