import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DrizzleModule } from 'src/modules/drizzle/drizzle.module';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from 'src/modules/auth/auth.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { FacultyModule } from './modules/faculty/faculty.module';
import { DepartmentModule } from './modules/department/department.module';
import { MaterialModule } from './modules/material/material.module';
import { CollectionModule } from './modules/collection/collection.module';
import { BlogModule } from './modules/blog/blog.module';
import envConfig from 'src/utils/config/env.config';
import { CoursesModule } from 'src/modules/courses/courses.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { EventsListeners } from 'src/utils/events/event.listener';
import { EmailService } from 'src/utils/email/email.service';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { getJwtConfig } from 'src/utils/config/jwt.config';
import { JWT_SYMBOL } from 'src/utils/config/constants.config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { CacheControlInterceptor } from './interceptors/cache-control.interceptor';

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
    BlogModule,
    CoursesModule,
    EventEmitterModule.forRoot({
      global: true,
      wildcard: true,
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => getJwtConfig(configService),
      inject: [ConfigService],
      global: true,
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    EventsListeners,
    EmailService,
    {
      provide: JWT_SYMBOL,
      useExisting: JwtService,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: CacheControlInterceptor,
    },
  ],
})
export class AppModule {}
