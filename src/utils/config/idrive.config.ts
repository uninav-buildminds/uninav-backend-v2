import { S3Client } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { ENV } from 'src/utils/config/env.enum';

export const createS3Client = (configService: ConfigService) => {
  return new S3Client({
    region: configService.get(ENV.IDRIVE_REGION),
    endpoint: configService.get(ENV.IDRIVE_ENDPOINT), // S3-compatible endpoint
    credentials: {
      accessKeyId: configService.get(ENV.IDRIVE_ACCESS_KEY),
      secretAccessKey: configService.get(ENV.IDRIVE_SECRET_KEY),
    },
  });
};
