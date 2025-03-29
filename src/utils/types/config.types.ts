import { ConfigType as CType } from '@nestjs/config';
import setupConfig from 'src/utils/config/setup.config';
export type ConfigType = CType<typeof setupConfig>;
