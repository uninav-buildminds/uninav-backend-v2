import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { S3 } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  GetObjectCommand,
  DeleteObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { ENV } from 'src/utils/config/env.enum';
import { MulterFile } from '@app/common/types';

@Injectable()
export class StorageService {
  private s3: S3;
  private publicBucket: string;
  private privateBucket: string;
  private endpoint: string;
  private logger = new Logger(StorageService.name);

  constructor(private readonly configService: ConfigService) {
    let endpoint = this.configService.get(ENV.IDRIVE_ENDPOINT) as string;
    this.endpoint = endpoint.startsWith('https')
      ? endpoint
      : `https://${endpoint}`;
    this.s3 = new S3({
      endpoint: this.endpoint,
      region: this.configService.get(ENV.IDRIVE_REGION),
      credentials: {
        accessKeyId: this.configService.get(ENV.IDRIVE_ACCESS_KEY),
        secretAccessKey: this.configService.get(ENV.IDRIVE_SECRET_KEY),
      },
    });
    this.publicBucket = this.configService.get(ENV.IDRIVE_PUBLIC_BUCKET);
    this.privateBucket = this.configService.get(ENV.IDRIVE_PRIVATE_BUCKET);
  }

  static generatePublicUrl(
    endpoint: string,
    bucket: string,
    fileKey: string,
  ): string {
    return `${endpoint}/${bucket}/${fileKey}`;
  }

  async uploadFile(
    file: MulterFile,
    bucketType: 'public' | 'private' = 'public',
    folder?: string,
  ): Promise<{ publicUrl: string; fileKey: string }> {
    const bucket =
      bucketType === 'public' ? this.publicBucket : this.privateBucket;

    const fileName = `${randomUUID()}-${file.originalname.replace(/\s+/g, '_')}`;
    const fileKey = folder ? `${folder}/${fileName}` : fileName;

    this.logger.log(`Uploading file to ${bucket}: ${fileKey}`);

    try {
      await this.s3.putObject({
        Bucket: bucket,
        Key: fileKey,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: bucketType === 'public' ? 'public-read' : 'private',
      });
    } catch (error) {
      this.logger.error(`Failed to upload file: ${error.message}`, error);
      throw new InternalServerErrorException(
        'Failed to upload file. Please try again.',
      );
    }

    return {
      publicUrl: await this.getSignedUrl(
        fileKey,
        3600 * 24 * 7,
        false,
        'private',
      ),
      fileKey,
    };
  }

  async uploadBlogImage(
    file: MulterFile,
  ): Promise<{ publicUrl: string; fileKey: string }> {
    return this.uploadFile(file, 'public', 'media');
  }

  async uploadBlogContent(
    content: string,
    blogId?: string,
  ): Promise<{ publicUrl: string; fileKey: string }> {
    const fileName = `${blogId || randomUUID()}-content.md`;
    const fileKey = `blogs/${fileName}`;

    this.logger.log(
      `Uploading blog content to ${this.publicBucket}: ${fileKey}`,
    );

    try {
      await this.s3.putObject({
        Bucket: this.publicBucket,
        Key: fileKey,
        Body: Buffer.from(content, 'utf-8'),
        ContentType: 'text/markdown',
        ACL: 'public-read',
      });

      return {
        publicUrl: StorageService.generatePublicUrl(
          this.endpoint,
          this.publicBucket,
          fileKey,
        ),
        fileKey,
      };
    } catch (error) {
      this.logger.error(
        `Failed to upload blog content: ${error.message}`,
        error,
      );
      throw new InternalServerErrorException(
        'Failed to upload blog content. Please try again.',
      );
    }
  }

  async updateBlogContent(
    content: string,
    fileKey: string,
  ): Promise<{ publicUrl: string; fileKey: string }> {
    this.logger.log(`Updating blog content: ${fileKey}`);

    try {
      await this.s3.putObject({
        Bucket: this.publicBucket,
        Key: fileKey,
        Body: Buffer.from(content, 'utf-8'),
        ContentType: 'text/markdown',
        ACL: 'public-read',
      });

      return {
        publicUrl: StorageService.generatePublicUrl(
          this.endpoint,
          this.publicBucket,
          fileKey,
        ),
        fileKey,
      };
    } catch (error) {
      this.logger.error(
        `Failed to update blog content: ${error.message}`,
        error,
      );
      throw new InternalServerErrorException(
        'Failed to update blog content. Please try again.',
      );
    }
  }

  async getBlogContent(fileKey: string): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.publicBucket,
        Key: fileKey,
      });

      const response = await this.s3.send(command);
      const bodyContents = await response.Body.transformToString('utf-8');
      return bodyContents;
    } catch (error) {
      this.logger.error(`Failed to get blog content: ${error.message}`, error);
      throw new InternalServerErrorException(
        'Failed to retrieve blog content. Please try again.',
      );
    }
  }

  async getSignedUrl(
    fileKey: string,
    expiry: number,
    forDownload: boolean = false,
    bucketType: 'public' | 'private' = 'public',
  ): Promise<string> {
    try {
      const bucketName =
        bucketType === 'public' ? this.publicBucket : this.privateBucket;

      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: fileKey,
      });

      if (forDownload) {
        command.input.ResponseContentDisposition = 'attachment';
      }

      const url = await getSignedUrl(this.s3, command, { expiresIn: expiry });
      return url;
    } catch (error) {
      this.logger.error(
        `Error generating signed URL: ${error.message}`,
        error.stack,
      );
      throw new Error(`Failed to generate signed URL: ${error.message}`);
    }
  }

  async deleteFile(
    fileKey: string,
    bucketType: 'public' | 'private' = 'public',
  ): Promise<boolean> {
    if (!fileKey) return true;

    const bucket =
      bucketType === 'public' ? this.publicBucket : this.privateBucket;

    try {
      const command = new DeleteObjectCommand({
        Bucket: bucket,
        Key: fileKey,
      });

      await this.s3.send(command);
      return true;
    } catch (error) {
      this.logger.error('Error deleting file:', error);
      return false;
    }
  }
}
