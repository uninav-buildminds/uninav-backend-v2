import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { S3 } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { ENV } from 'src/utils/config/env.enum';
import { MulterFile } from 'src/utils/types';
import { B2_BUCKETS } from 'src/utils/config/constants.config';

@Injectable()
export class StorageService {
  private s3: S3;
  private bucketMedia: string;
  private bucketDocs: string;
  private endpoint: string;
  private logger = new Logger(StorageService.name);
  constructor(private readonly configService: ConfigService) {
    let endpoint = this.configService.get(ENV.B2_ENDPOINT) as string;
    this.endpoint = endpoint.startsWith('https')
      ? endpoint
      : `https://${endpoint}`;
    this.s3 = new S3({
      endpoint: this.endpoint,
      region: this.configService.get(ENV.B2_REGION),
      credentials: {
        accessKeyId: this.configService.get(ENV.B2_ACCESS_KEY),
        secretAccessKey: this.configService.get(ENV.B2_SECRET_KEY),
      },
    });
    this.bucketMedia = B2_BUCKETS.media;
    this.bucketDocs = B2_BUCKETS.docs;
  }

  /**
   * Upload a file to Backblaze B2
   * @param file The file to upload
   * @param isMedia Whether the file is a media file or document
   * @returns The URL of the uploaded file
   */
  async uploadFile(
    file: MulterFile,
    isMedia = false,
  ): Promise<{ publicUrl: string; fileKey: string }> {
    // Determine folder based on file type
    const bucket = isMedia ? this.bucketMedia : this.bucketDocs;

    const fileKey = `${randomUUID()}-${file.originalname.replace(/\s+/g, '_')}`;
    this.logger.log(`Uploading file to ${bucket}: ${fileKey}`);
    // Upload file to Backblaze B2
    try {
      await this.s3.putObject({
        Bucket: bucket,
        Key: fileKey,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: 'public-read', // Make the file publicly accessible
      });
    } catch (error) {
      this.logger.error(`Failed to upload file: ${error.message}`, error);
      throw new InternalServerErrorException(
        'Failed to upload file. Please try again.',
      );
    }

    // Return the public URL and file key
    return { publicUrl: `${this.endpoint}/${bucket}/${fileKey}`, fileKey };
  }

  /**
   * Generate a signed URL for downloading a file
   * @param fileKey The key of the file in the bucket
   * @param expiresIn Time in seconds until the URL expires
   * @param forceDownload Whether to force download or open in browser
   * @returns The signed URL for downloading the file
   */
  async getSignedUrl(
    fileKey: string,
    expiresIn = 3600 * 24 * 7,
    forceDownload = false,
  ): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketDocs,
      Key: fileKey,
      // Set response headers for force download if requested
      ...(forceDownload && {
        ResponseContentDisposition: `attachment; filename="${fileKey.split('/').pop()}"`,
      }),
    });

    try {
      // generate the signed url
      const url = getSignedUrl(this.s3, command, { expiresIn });
      return url;
    } catch (error) {
      this.logger.error(
        `Failed to generate signed URL: ${error.message}`,
        error,
      );
      throw new InternalServerErrorException(
        'Failed to generate signed URL. Please try again.',
      );
    }
  }

  /**
   * Delete a file from Backblaze B2
   * @param fileKey The key of the file in the bucket
   * @param isMedia Whether the file is in the media folder
   * @returns True if deletion was successful
   */
  async deleteFile(fileKey: string, isMedia = false): Promise<boolean> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: isMedia ? this.bucketMedia : this.bucketDocs,
        Key: fileKey,
      });

      await this.s3.send(command);
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }
}
