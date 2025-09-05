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
import { MulterFile } from 'src/utils/types';

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

  /**
   * Upload a file to IDrive storage
   * @param file The file to upload
   * @param bucketType 'public' or 'private' - determines which bucket to use
   * @param folder Optional folder path within the bucket (e.g., 'media', 'docs', 'blogs')
   * @returns The URL of the uploaded file and file key
   */
  async uploadFile(
    file: MulterFile,
    bucketType: 'public' | 'private' = 'public',
    folder?: string,
  ): Promise<{ publicUrl: string; fileKey: string }> {
    const bucket =
      bucketType === 'public' ? this.publicBucket : this.privateBucket;

    // Create file key with optional folder structure
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

    // Return the public URL and file key
    return { publicUrl: `${this.endpoint}/${bucket}/${fileKey}`, fileKey };
  }

  /**
   * Upload a blog image to the public bucket under media folder
   * @param file The image file to upload
   * @returns Object containing the public URL and file key
   */
  async uploadBlogImage(
    file: MulterFile,
  ): Promise<{ publicUrl: string; fileKey: string }> {
    return this.uploadFile(file, 'public', 'media');
  }

  /**
   * Upload blog content (markdown) to the public bucket under blogs folder
   * @param content The markdown content as string
   * @param blogId Optional blog ID to use in the file key
   * @returns Object containing the public URL and file key
   */
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
        publicUrl: `${this.endpoint}/${this.publicBucket}/${fileKey}`,
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

  /**
   * Update existing blog content in the public bucket
   * @param content The new markdown content
   * @param fileKey The existing file key
   * @returns Object containing the public URL and file key
   */
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
        publicUrl: `${this.endpoint}/${this.publicBucket}/${fileKey}`,
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

  /**
   * Fetch blog content from the public bucket
   * @param fileKey The key of the content file
   * @returns The markdown content as string
   */
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

  /**
   * Get a signed URL for a file in the storage
   * @param fileKey The file key/path in the bucket
   * @param expiry Expiry time in seconds
   * @param forDownload Whether the URL is for download (with attachment disposition)
   * @param bucketType 'public' or 'private' - determines which bucket to use
   * @returns A signed URL for accessing the file
   */
  async getSignedUrl(
    fileKey: string,
    expiry: number,
    forDownload: boolean = false,
    bucketType: 'public' | 'private' = 'public',
  ): Promise<string> {
    try {
      // Determine which bucket to use
      const bucketName =
        bucketType === 'public' ? this.publicBucket : this.privateBucket;

      // Create the command with appropriate parameters
      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: fileKey,
      });

      // Add response content disposition for downloads if needed
      if (forDownload) {
        command.input.ResponseContentDisposition = 'attachment';
      }

      // Generate the signed URL using the AWS SDK
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

  /**
   * Delete a file from IDrive storage
   * @param fileKey The key of the file in the bucket
   * @param bucketType 'public' or 'private' - determines which bucket to use
   * @returns True if deletion was successful
   */
  async deleteFile(
    fileKey: string,
    bucketType: 'public' | 'private' = 'public',
  ): Promise<boolean> {
    if (!fileKey) return true; // Skip if no file key

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
