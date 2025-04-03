import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DrizzleModule } from 'src/modules/drizzle/drizzle.module';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from 'src/modules/auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { FacultyModule } from './modules/faculty/faculty.module';
import { DepartmentModule } from './modules/department/department.module';
import { MaterialModule } from './modules/material/material.module';
import { CollectionModule } from './modules/collection/collection.module';
import envConfig from 'src/utils/config/env.config';
import { CoursesModule } from 'src/modules/courses/courses.module';
@Module({
  imports: [
    DrizzleModule,
    UserModule,
    AuthModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
      cache: true,
      expandVariables: true,
      load: [envConfig],
    }),
    FacultyModule,
    DepartmentModule,
    MaterialModule,
    CollectionModule,
    CoursesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
