import { Global, Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from 'src/modules/user/user.module';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { getJwtConfig } from 'src/utils/config/jwt.config';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JWT_SYMBOL } from 'src/utils/config/constants.config';
import { LocalStrategy } from 'src/modules/auth/strategies/local.strategy';
import { AuthRepository } from './auth.repository';
import { DatabaseModule } from '@app/common/modules/database/database.module';
import { DepartmentModule } from 'src/modules/department/department.module';
import { EmailService } from 'src/utils/email/email.service';
import { AdminModule } from 'src/modules/user/submodules/admin/admin.module';
import { ModeratorModule } from 'src/modules/user/submodules/moderator/moderator.module';
import { PassportModule } from '@nestjs/passport';

import { GoogleStrategy } from './strategies/google.strategy';
import { NotificationsModule } from '../notifications/notifications.module';

@Global()
@Module({
  imports: [
    DatabaseModule,
    DepartmentModule,
    UserModule,
    AdminModule,
    ModeratorModule,
    NotificationsModule,
    PassportModule,
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_SECRET,
        signOptions: { expiresIn: '1d' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthRepository,
    LocalStrategy,
    GoogleStrategy,
    EmailService,
    {
      provide: JWT_SYMBOL,
      useExisting: JwtService,
    },
  ],
  exports: [
    AuthService,
    AuthRepository,
    {
      provide: JWT_SYMBOL,
      useExisting: JwtService,
    },
  ],
})
export class AuthModule {}
