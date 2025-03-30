import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from 'src/user/user.module';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { getJwtConfig } from 'src/utils/config/jwt.config';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JWT_SYMBOL } from 'src/utils/config/constants.config';
import { LocalStrategy } from 'src/auth/strategies/local.strategy';

@Module({
  imports: [
    UserModule,

    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => getJwtConfig(configService),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    LocalStrategy,
    {
      provide: JWT_SYMBOL,
      useExisting: JwtService,
    },
  ],
})
export class AuthModule {}
