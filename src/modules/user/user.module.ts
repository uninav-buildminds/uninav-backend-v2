import { Global, Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { UserRepository } from './user.repository';
import { DatabaseModule } from '@app/common/modules/database/database.module';
import { DepartmentModule } from 'src/modules/department/department.module';
import { CoursesModule } from '../courses/courses.module';
import { UsernameGeneratorHelper } from '../../utils/helpers/username-generator.helper';
import { StorageService } from '../../utils/storage/storage.service';
import { PointsModule } from './submodules/stats/points.module';

@Global()
@Module({
  imports: [DatabaseModule, DepartmentModule, CoursesModule, PointsModule],
  controllers: [UserController],
  providers: [
    UserService,
    UserRepository,
    UsernameGeneratorHelper,
    StorageService,
  ],
  exports: [UserService],
})
export class UserModule {}
