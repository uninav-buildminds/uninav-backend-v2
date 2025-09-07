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
import { CoursesModule } from 'src/modules/courses/courses.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { EventsListeners } from 'src/utils/events/event.listener';
import { EmailService } from 'src/utils/email/email.service';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { getJwtConfig } from 'src/utils/config/jwt.config';
import { JWT_SYMBOL } from 'src/utils/config/constants.config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { CacheControlInterceptor } from './interceptors/cache-control.interceptor';
import { AdvertModule } from 'src/modules/advert/advert.module';
import { ReviewModule } from './modules/review/review.module';
import { GlobalModule } from './modules/global/global.module';

@Module({
  imports: [
    DrizzleModule,
    GlobalModule,
    UserModule,
    AuthModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      cache: false,
      expandVariables: true,
    }),
    FacultyModule,
    DepartmentModule,
    MaterialModule,
    CollectionModule,
    BlogModule,
    CoursesModule,
    EventEmitterModule.forRoot({
      wildcard: true,
      global: true,
      delimiter: '.',
      maxListeners: 20,
      verboseMemoryLeak: true,
      ignoreErrors: false,
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => getJwtConfig(configService),
      inject: [ConfigService],
      global: true,
    }),
    AdvertModule,
    ReviewModule,
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
