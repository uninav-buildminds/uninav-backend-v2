import 'dotenv/config';
import { ENV } from 'src/utils/config/env.enum';
export class EnvValidation {
  private static requiredEnvVars = Object.values(ENV);

  static validate(): void {
    for (const envVar of this.requiredEnvVars) {
      if (!process.env[envVar]) {
        throw new Error(`Missing required environment variable: ${envVar}`);
      }
    }
  }

  static isDevelopment(): boolean {
    return process.env.NODE_ENV === 'development';
  }

  static isProduction(): boolean {
    return process.env.NODE_ENV === 'production';
  }
}
