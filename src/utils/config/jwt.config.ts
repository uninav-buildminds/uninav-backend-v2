import { ConfigService } from '@nestjs/config';
import { JwtModuleOptions } from '@nestjs/jwt';
import { ENV } from 'src/utils/config/env.enum';

export const getJwtConfig = (
  configService: ConfigService,
): JwtModuleOptions => {
  return {
    secret: configService.get(ENV.JWT_SECRET),
    signOptions: {
      expiresIn: '7d',
    },
  };
};
