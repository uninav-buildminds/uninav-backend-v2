import { Injectable } from '@nestjs/common';
import { S3 } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { ENV } from 'src/utils/config/env.enum';

@Injectable()
export class StorageService {
  private s3: S3;
  private bucketName: string;
  private endpoint: string;

  constructor(private readonly configService: ConfigService) {
    this.endpoint = this.configService.get(ENV.B2_ENDPOINT);
    this.s3 = new S3({
      endpoint: this.endpoint,
      region: this.configService.get(ENV.B2_REGION),
      credentials: {
        accessKeyId: this.configService.get(ENV.B2_ACCESS_KEY),
        secretAccessKey: this.configService.get(ENV.B2_SECRET_KEY),
      },
    });
    this.bucketName = this.configService.get<string>('BACKBLAZE_BUCKET_NAME');
  }

  /**
   * Upload a file to Backblaze B2
   * @param file The file to upload
   * @param isMedia Whether the file is a media file or document
   * @returns The URL of the uploaded file
   */
  async uploadFile(
    file: Express.Multer.File,
    isMedia = false,
  ): Promise<string> {
    // Determine folder based on file type
    const folder = isMedia ? 'media' : 'documents';

    // Create a unique filename to prevent duplicates
    const fileKey = `${folder}/${randomUUID()}-${file.originalname.replace(/\s+/g, '_')}`;

    // Upload file to Backblaze B2
    await this.s3.putObject({
      Bucket: this.bucketName,
      Key: fileKey,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read', // Make the file publicly accessible
    });

    // Return the public URL
    return `${this.endpoint}/${this.bucketName}/${fileKey}`;
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
    expiresIn = 3600,
    forceDownload = false,
  ): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: fileKey,
      // Set response headers for force download if requested
      ...(forceDownload && {
        ResponseContentDisposition: `attachment; filename="${fileKey.split('/').pop()}"`,
      }),
    });

    // Generate and return the signed URL
    return getSignedUrl(this.s3, command, { expiresIn });
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
        Bucket: this.bucketName,
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
