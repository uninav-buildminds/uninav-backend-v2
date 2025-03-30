import { ConfigType as CType } from '@nestjs/config';
import envConfig from 'src/utils/config/env.config';
export type ConfigType = CType<typeof envConfig>;
