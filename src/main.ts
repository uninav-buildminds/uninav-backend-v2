import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { EnvValidation } from 'src/utils/env.validation';
import { AppEnum } from 'src/utils/config/app.config';
import helmet from 'helmet';
import { HttpExceptionFilter } from 'src/utils/exceptions/http-exception-filter';
import { LoggerService } from 'src/utils/logger/logger.service';
import { LoggerPaths } from 'src/utils/config/constants.config';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  console.log('Server Starting up....');
  const port = process.env.PORT ?? 3000;
  EnvValidation.validate();
  console.log(`=>     http://localhost:${port}`);
  const app = await NestFactory.create(AppModule, {
    logger: new LoggerService(LoggerPaths.APP, false),
  });

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('UniNav API')
    .setDescription(
      'The UniNav API - A comprehensive university navigation and resource sharing platform',
    )
    .setVersion('1.0.0')
    .setContact('UniNav Team', 'https://uninav.live', 'enweremproper@gmail.com')
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .addTag('App', 'Application root endpoints')
    .addTag('Authentication', 'User authentication and authorization endpoints')
    .addTag('Users', 'User management and profile operations')
    .addTag('Materials', 'Educational materials management')
    .addTag('Collections', 'Material collections and organization')
    .addTag('Blogs', 'Blog posts and articles')
    .addTag('Courses', 'Course information and management')
    .addTag('Faculty', 'Faculty information and management')
    .addTag('Department', 'Department information and management')
    .addTag('Collection', 'Individual collection operations and management')
    .addTag('Advert', 'Advertisement creation and management')
    .addTag('CourseReview', 'Course review and rating system')
    .addTag('DLCReview', 'Distance Learning Course review system')
    .addTag('MaterialReview', 'Educational material review and feedback')
    .addTag('BlogReview', 'Blog post review and moderation')
    .addTag('AdvertReview', 'Advertisement review and approval system')
    .addTag('Reviews', 'General content review and moderation endpoints')
    .addBearerAuth(
      {
        description: 'JWT Authorization token, in authorization header',
        name: 'Authorization',
        bearerFormat: 'Bearer',
        scheme: 'Bearer',
        type: 'http',
        in: 'Header',
      },
      'access-token',
    )
    .addCookieAuth('authorization', {
      type: 'http',
      in: 'Cookie',
      scheme: 'Bearer',
      description: 'JWT Authorization token in server cookies',
    })
    .addApiKey(
      {
        type: 'apiKey',
        name: 'root-api-key',
        in: 'header',
        description: 'Root API key for admin operations',
      },
      'root-api-key',
    )
    .addServer(`http://localhost:${port}`, 'Development server')
    .addServer(process.env.SERVER_URL, 'Production server')
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, documentFactory, {
    customSiteTitle: 'UniNav API Documentation',
    customfavIcon: '/favicon.ico',
    customCss: '.swagger-ui .topbar { display: none }',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      docExpansion: 'none', // Collapse all sections by default
      defaultModelsExpandDepth: 1,
      defaultModelExpandDepth: 1,
    },
  });

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  );
  app.use(helmet(AppEnum.HELMET_OPTIONS));
  app.enableCors(AppEnum.CORS_OPTIONS);
  // * format exceptions response
  app.useGlobalFilters(new HttpExceptionFilter());
  app.use(cookieParser());
  await app.listen(port);
  if (EnvValidation.isDevelopment()) {
    console.log(`Server is running in development mode`);
    console.log(
      `Swagger documentation available at: http://localhost:${port}/api/docs`,
    );
  } else {
    console.log(`Server is running in production mode`);
  }
  console.log(`Press CTRL + C to stop the server`);
}
bootstrap();
