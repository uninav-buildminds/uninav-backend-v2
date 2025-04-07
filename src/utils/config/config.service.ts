import { ConfigService as ConfigServiceBase } from '@nestjs/config';
import { ENV } from 'src/utils/config/env.enum';
import 'dotenv/config';
class ConfigService extends ConfigServiceBase {
  constructor() {
    super();
  }
  get(key: ENV): string {
    // Add your custom logic here if needed
    return super.get(key);
  }
  set(key: ENV, value: any): void {
    // Add your custom logic here if needed
    super.set(key, value);
  }
}
const configService = new ConfigServiceBase();
export { configService, ConfigService };
