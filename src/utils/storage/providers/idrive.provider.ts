import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommandInput,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import {
  IStorageProvider,
  MulterFile,
  UploadOptions,
  UploadResult,
} from '../interfaces/storage.interface';
import { ENV } from '../../config/env.enum';

@Injectable()
export class IDriveProvider implements IStorageProvider {
  private s3Client: S3Client;
  private publicBucket: string;
  private privateBucket: string;
  private endpoint: string;

  constructor(private configService: ConfigService) {
    let endpoint = this.configService.get(ENV.IDRIVE_ENDPOINT) as string;
    this.endpoint = endpoint.startsWith('https')
      ? endpoint
      : `https://${endpoint}`;

    this.s3Client = new S3Client({
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

  async uploadFile(
    file: MulterFile,
    options: UploadOptions,
  ): Promise<UploadResult> {
    const bucket = options.bucket;

    const fileName =
      options.fileName || this.generateFileName(file.originalname);
    const key = options.folder ? `${options.folder}/${fileName}` : fileName;

    // Infer ACL from bucket naming (public/private)
    const isPublic = bucket.toLowerCase().includes('public');
    const acl = isPublic ? 'public-read' : 'private';

    const uploadParams: PutObjectCommandInput = {
      Bucket: bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: acl,
      ServerSideEncryption: 'AES256',
      Metadata: {
        originalName: file.originalname,
        uploadedBy: 'storage-service',
        uploadedAt: new Date().toISOString(),
      },
    };

    const command = new PutObjectCommand(uploadParams);
    await this.s3Client.send(command);

    // Generate URL based on bucket type
    // const url = isPublic
    //   ? this.getPublicFileUrl(key, bucket)
    //   : await this.getSignedFileUrl(key, bucket);

    return {
      fileKey: key,
      url: await this.getSignedFileUrl(key, bucket),
      bucketType: isPublic ? 'public' : 'private',
      size: file.size,
      mimeType: file.mimetype,
      originalName: file.originalname,
      uploadedAt: new Date(),
    };
  }

  async getSignedFileUrl(
    fileKey: string,
    bucket: string,
    expiresIn = 3600,
  ): Promise<string> {
    console.log('fileKey', fileKey);
    console.log('bucket', bucket);
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: fileKey,
    });

    return getSignedUrl(this.s3Client, command, { expiresIn });
  }

  getPublicFileUrl(fileKey: string, bucket: string): string {
    return `${this.endpoint}/${bucket}/${fileKey}`;
  }

  async deleteFile(fileKey: string, bucket: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: fileKey,
    });

    await this.s3Client.send(command);
  }

  // Generate a unique file name with extension preserved
  private generateFileName(originalName: string): string {
    const extension = originalName.split('.').pop();
    return `${randomUUID()}-${originalName.replace(/\s+/g, '_')}`;
  }
}
