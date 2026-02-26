import { Global, Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { UserRepository } from './user.repository';
import { DatabaseModule } from '@app/common/modules/database/database.module';
import { DepartmentModule } from 'src/modules/department/department.module';
import { CoursesModule } from '../courses/courses.module';
import { UsernameGeneratorHelper } from '../../utils/helpers/username-generator.helper';
import { StorageModule } from '../../utils/storage/storage.module';
import { PointsController } from './submodules/stats/points.controller';
import { PointsService } from './submodules/stats/points.service';
import { PointsRepository } from './submodules/stats/points.repository';
import { NotificationsModule } from '../notifications/notifications.module';

@Global()
@Module({
  imports: [
    DatabaseModule,
    DepartmentModule,
    CoursesModule,
    StorageModule,
    NotificationsModule,
  ],
  controllers: [PointsController, UserController],
  providers: [
    UserService,
    PointsService,
    PointsRepository,
    UserRepository,
    UsernameGeneratorHelper,
  ],
  exports: [UserService, PointsService],
})
export class UserModule {}
