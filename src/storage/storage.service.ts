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
import { B2_BUCKETS } from 'src/utils/config/constants.config';

@Injectable()
export class StorageService {
  private s3: S3;
  private bucketMedia: string;
  private bucketDocs: string;
  private bucketBlogs: string;
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
    this.bucketBlogs = B2_BUCKETS.blogs;
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
   * Upload a blog image to the media bucket
   * @param file The image file to upload
   * @returns Object containing the public URL and file key
   */
  async uploadBlogImage(
    file: MulterFile,
  ): Promise<{ publicUrl: string; fileKey: string }> {
    return this.uploadFile(file, true);
  }

  /**
   * Upload blog content (markdown) to the blogs bucket
   * @param content The markdown content as string
   * @param blogId Optional blog ID to use in the file key
   * @returns Object containing the public URL and file key
   */
  async uploadBlogContent(
    content: string,
    blogId?: string,
  ): Promise<{ publicUrl: string; fileKey: string }> {
    const fileKey = `${blogId || randomUUID()}-content.md`;
    this.logger.log(
      `Uploading blog content to ${this.bucketBlogs}: ${fileKey}`,
    );

    try {
      await this.s3.putObject({
        Bucket: this.bucketBlogs,
        Key: fileKey,
        Body: Buffer.from(content, 'utf-8'),
        ContentType: 'text/markdown',
        ACL: 'public-read',
      });

      return {
        publicUrl: `${this.endpoint}/${this.bucketBlogs}/${fileKey}`,
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
   * Update existing blog content in the blogs bucket
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
        Bucket: this.bucketBlogs,
        Key: fileKey,
        Body: Buffer.from(content, 'utf-8'),
        ContentType: 'text/markdown',
        ACL: 'public-read',
      });

      return {
        publicUrl: `${this.endpoint}/${this.bucketBlogs}/${fileKey}`,
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
   * Fetch blog content from the blogs bucket
   * @param fileKey The key of the content file
   * @returns The markdown content as string
   */
  async getBlogContent(fileKey: string): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketBlogs,
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
   * @param bucketType The bucket type ('media', 'blogs', etc.) - defaults to docs bucket
   * @returns A signed URL for accessing the file
   */
  async getSignedUrl(
    fileKey: string,
    expiry: number,
    forDownload: boolean = false,
    bucketType: string = 'docs',
  ): Promise<string> {
    try {
      // Determine which bucket to use
      const bucketName = this.getStorageBucket(bucketType);

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
   * Helper method to get the correct bucket name based on type
   */
  private getStorageBucket(bucketType: string): string {
    switch (bucketType) {
      case 'media':
        return this.bucketMedia;
      case 'blogs':
        return this.bucketBlogs;
      case 'docs':
        return this.bucketDocs;
      default:
        return this.bucketDocs;
    }
  }

  /**
   * Delete a file from any Backblaze B2 bucket
   * @param fileKey The key of the file in the bucket
   * @param bucketType The type of bucket: 'media', 'docs', or 'blogs'
   * @returns True if deletion was successful
   */
  async deleteFile(
    fileKey: string,
    bucketType: 'media' | 'docs' | 'blogs' = 'docs',
  ): Promise<boolean> {
    if (!fileKey) return true; // Skip if no file key

    let bucket: string;
    switch (bucketType) {
      case 'media':
        bucket = this.bucketMedia;
        break;
      case 'blogs':
        bucket = this.bucketBlogs;
        break;
      default:
        bucket = this.bucketDocs;
    }

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
