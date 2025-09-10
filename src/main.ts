import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { EnvValidation } from 'src/utils/env.validation';
import { AppEnum } from 'src/utils/config/app.config';
import helmet from 'helmet';
import { HttpExceptionFilter } from '@app/common/exceptions/http-exception-filter';
import { StructuredLoggerService } from '@app/common/modules/logger';
import { LoggerPaths } from 'src/utils/config/constants.config';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  console.log('Server Starting up....');
  const port = process.env.PORT ?? 3000;
  EnvValidation.validate();
  console.log(`=>     http://localhost:${port}`);
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  // Set up structured logger
  // const logger = await app.resolve(StructuredLoggerService);
  // app.useLogger(logger);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: false,
      forbidNonWhitelisted: false,
      skipMissingProperties: false,
      transform: true,
    }),
  );
  app.use(helmet(AppEnum.HELMET_OPTIONS));
  app.enableCors(AppEnum.CORS_OPTIONS);
  // * format exceptions response
  app.useGlobalFilters(new HttpExceptionFilter());
  app.use(cookieParser());
  await app.listen(port);
  if (EnvValidation.isDevelopment()) {
    console.log(`Server is running in development mode`);
  } else {
    console.log(`Server is running in production mode`);
  }
  console.log(`Press CTRL + C to stop the server`);
}
bootstrap();
