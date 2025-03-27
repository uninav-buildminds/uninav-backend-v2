import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { EnvValidation } from 'src/utils/env.validation';
import { AppEnum } from 'src/utils/config/app.config';
import helmet from 'helmet';
import cors from 'cors';
async function bootstrap() {
  console.log('Server Starting up....');
  const port = process.env.PORT ?? 3000;
  EnvValidation.validate();
  console.log(`=>     http://localhost:${port}`);
  const app = await NestFactory.create(AppModule);

  app.use(helmet(AppEnum.HELMET_OPTIONS));
  app.use(cors(AppEnum.CORS_OPTIONS));

  await app.listen(port);
  if (EnvValidation.isDevelopment()) {
    console.log(`Server is running in development mode`);
  }
  if (EnvValidation.isProduction()) {
    console.log(`Server is running in production mode`);
  }
  console.log(`Press CTRL + C to stop the server`);
}
bootstrap();
