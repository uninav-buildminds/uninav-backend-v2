import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import * as pdfjsLib from 'pdfjs-dist';
import { createCanvas } from 'canvas';
import { StorageService } from 'src/utils/storage/storage.service';
import { ENV } from 'src/utils/config/env.enum';
import { STORAGE_FOLDERS } from 'src/utils/config/constants.config';
import { DriveFile, DriveUrlParsed, PreviewResult } from '../dto/preview.dto';

@Injectable()
export class PreviewService {
  private readonly logger = new Logger(PreviewService.name);
  private readonly apiClient: AxiosInstance;
  private readonly googleApiKey: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly storageService: StorageService,
  ) {
    // Configure Google API
    this.googleApiKey = this.configService.get<string>(ENV.GOOGLE_API_KEY);
    this.apiClient = axios.create({
      baseURL: 'https://www.googleapis.com/drive/v3',
      timeout: 30000,
      params: { key: this.googleApiKey },
    });

    // Configure pdfjs-dist for server-side rendering
    pdfjsLib.GlobalWorkerOptions.workerSrc = null;
  }

  /**
   * Generate preview for Google Drive PDF file
   * @param fileId Google Drive file ID
   * @param resourceKey Optional resource key for restricted files
   * @returns Public URL of the generated preview image
   */
  async generateGDrivePdfPreview(
    fileId: string,
    resourceKey?: string,
  ): Promise<string> {
    try {
      this.logger.log(
        `Generating Google Drive PDF preview for file: ${fileId}`,
      );

      // Download PDF from Google Drive
      const pdfBuffer = await this.downloadGDriveFile(fileId, resourceKey);

      // Convert first page to PNG
      const pngBuffer = await this.convertPdfFirstPageToPng(pdfBuffer);

      // Upload to storage
      const filename = `gdrive-${fileId}-preview.png`;
      const previewUrl = await this.uploadPreviewImage(pngBuffer, filename);

      this.logger.log(
        `Successfully generated Google Drive PDF preview: ${previewUrl}`,
      );
      return previewUrl;
    } catch (error) {
      this.logger.error(
        `Failed to generate Google Drive PDF preview: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Generate preview for direct PDF buffer
   * @param pdfBuffer PDF content as Buffer
   * @param filename Target filename for the preview
   * @param width Target width for the output image (default: 1000px)
   * @returns Public URL of the generated preview image
   */
  async generatePdfPreview(
    pdfBuffer: Buffer,
    filename: string,
    width: number = 1000,
  ): Promise<string> {
    try {
      this.logger.log(`Generating PDF preview: ${filename}`);

      // Convert first page to PNG
      const pngBuffer = await this.convertPdfFirstPageToPng(pdfBuffer, width);

      // Upload to storage
      const previewFilename = `pdf-${filename}-preview.png`;
      const previewUrl = await this.uploadPreviewImage(
        pngBuffer,
        previewFilename,
      );

      this.logger.log(`Successfully generated PDF preview: ${previewUrl}`);
      return previewUrl;
    } catch (error) {
      this.logger.error(`Failed to generate PDF preview: ${error.message}`);
      throw error;
    }
  }

  /**
   * Process Google Drive URL and generate preview for material
   * @param url Google Drive URL
   * @returns Preview URL and metadata
   */
  async processGDriveUrl(url: string): Promise<PreviewResult> {
    try {
      const parsed = this.parseGDriveUrl(url);

      if (parsed.type === 'folder') {
        // For folders, get the first valid file and generate preview
        const files = await this.listGDriveFolderFiles(
          parsed.id,
          parsed.resourceKey,
        );

        if (files.length === 0) {
          throw new BadRequestException('Folder is empty');
        }

        // Find the first PDF file or file that can be previewed
        for (const file of files) {
          try {
            const result = await this.generateGDriveFilePreview(
              file,
              parsed.resourceKey,
            );
            return {
              previewUrl: result.previewUrl,
              metadata: {
                ...result.metadata,
                folderFiles: files.length,
                firstFileName: file.name,
                folderId: parsed.id,
              },
            };
          } catch (error) {
            this.logger.warn(
              `Could not generate preview for ${file.name}, trying next file`,
            );
            continue;
          }
        }

        throw new BadRequestException('No files in folder can be previewed');
      } else {
        // For single files, generate preview directly
        const fileMetadata = await this.getGDriveFileMetadata(
          parsed.id,
          parsed.resourceKey,
        );
        const result = await this.generateGDriveFilePreview(
          fileMetadata,
          parsed.resourceKey,
        );

        return {
          previewUrl: result.previewUrl,
          metadata: {
            ...result.metadata,
            fileId: parsed.id,
            fileName: fileMetadata.name,
          },
        };
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Failed to process Google Drive URL: ${error.message}`);
      throw new InternalServerErrorException(
        'Failed to process Google Drive URL',
      );
    }
  }

  // TODO: Add YouTube video preview generation support
  // async generateYouTubePreview(videoUrl: string): Promise<string> {
  //   // Extract video ID from URL
  //   // Use YouTube API to get video thumbnail
  //   // Upload thumbnail to storage
  //   // Return preview URL
  // }

  /**
   * Parse Google Drive URL to extract file/folder ID and resource key
   */
  private parseGDriveUrl(url: string): DriveUrlParsed {
    try {
      const urlObj = new URL(url);

      // Extract resource key from query params
      const resourceKey =
        urlObj.searchParams.get('resourcekey') ||
        urlObj.searchParams.get('usp');

      // Handle folder URLs
      if (url.includes('/drive/folders/')) {
        const folderMatch = url.match(/\/drive\/folders\/([a-zA-Z0-9_-]+)/);
        if (folderMatch) {
          return {
            id: folderMatch[1],
            type: 'folder',
            resourceKey: resourceKey || undefined,
          };
        }
      }

      // Handle file URLs
      if (url.includes('/file/d/')) {
        const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
        if (fileMatch) {
          return {
            id: fileMatch[1],
            type: 'file',
            resourceKey: resourceKey || undefined,
          };
        }
      }

      // Handle open URLs
      if (url.includes('/open?id=')) {
        const openMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
        if (openMatch) {
          return {
            id: openMatch[1],
            type: 'file',
            resourceKey: resourceKey || undefined,
          };
        }
      }

      throw new BadRequestException('Invalid Google Drive URL format');
    } catch (error) {
      this.logger.error(
        `Failed to parse Google Drive URL: ${url}`,
        error.stack,
      );
      throw new BadRequestException('Invalid Google Drive URL');
    }
  }

  /**
   * Download file from Google Drive
   */
  private async downloadGDriveFile(
    fileId: string,
    resourceKey?: string,
  ): Promise<Buffer> {
    try {
      // First, verify it's a PDF
      const metadata = await this.getGDriveFileMetadata(fileId, resourceKey);
      if (metadata.mimeType !== 'application/pdf') {
        throw new BadRequestException(
          `File is not a PDF. Found mimeType: ${metadata.mimeType}`,
        );
      }

      // Download the file
      const params: any = { alt: 'media', supportsAllDrives: true };
      if (resourceKey) {
        params.supportsAllDrives = true;
      }

      const response = await this.apiClient.get(`/files/${fileId}`, {
        params,
        responseType: 'arraybuffer',
        timeout: 60000,
      });

      return Buffer.from(response.data);
    } catch (error) {
      this.logger.error(
        `Failed to download Google Drive file: ${error.message}`,
      );

      if (error.response?.status === 404) {
        throw new BadRequestException('PDF file not found or not accessible');
      }
      if (error.response?.status === 403) {
        throw new BadRequestException('Access denied to PDF file');
      }
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Failed to download PDF from Google Drive',
      );
    }
  }

  /**
   * Get metadata for a Google Drive file
   */
  private async getGDriveFileMetadata(
    fileId: string,
    resourceKey?: string,
  ): Promise<DriveFile> {
    try {
      const params: any = {
        fields:
          'id,name,mimeType,size,modifiedTime,thumbnailLink,webViewLink,parents',
        supportsAllDrives: true,
      };

      if (resourceKey) {
        params.supportsAllDrives = true;
      }

      const response = await this.apiClient.get<DriveFile>(`/files/${fileId}`, {
        params,
      });
      return response.data;
    } catch (error) {
      this.logger.error(
        `Failed to get Google Drive file metadata: ${error.message}`,
      );
      throw new InternalServerErrorException(
        'Failed to retrieve file metadata',
      );
    }
  }

  /**
   * List files in a Google Drive folder
   */
  private async listGDriveFolderFiles(
    folderId: string,
    resourceKey?: string,
  ): Promise<DriveFile[]> {
    try {
      const files: DriveFile[] = [];
      let pageToken: string | undefined;

      do {
        const params: any = {
          q: `'${folderId}' in parents and trashed=false`,
          supportsAllDrives: true,
          includeItemsFromAllDrives: true,
          fields:
            'nextPageToken,files(id,name,mimeType,size,modifiedTime,thumbnailLink,webViewLink,parents)',
          pageSize: 100,
        };

        if (pageToken) params.pageToken = pageToken;
        if (resourceKey) {
          params.supportsAllDrives = true;
          params.includeItemsFromAllDrives = true;
        }

        const response = await this.apiClient.get('/files', { params });
        files.push(...response.data.files);
        pageToken = response.data.nextPageToken;
      } while (pageToken);

      return files;
    } catch (error) {
      this.logger.error(
        `Failed to list Google Drive folder files: ${error.message}`,
      );
      throw new InternalServerErrorException(
        'Failed to retrieve folder contents',
      );
    }
  }

  /**
   * Generate preview for a Google Drive file
   */
  private async generateGDriveFilePreview(
    file: DriveFile,
    resourceKey?: string,
  ): Promise<PreviewResult> {
    try {
      // Handle Google Workspace files (use thumbnail if available)
      if (file.thumbnailLink && this.isGoogleWorkspaceFile(file.mimeType)) {
        return {
          previewUrl: file.thumbnailLink,
          metadata: { source: 'google-thumbnail', mimeType: file.mimeType },
        };
      }

      // Handle PDF files
      if (file.mimeType === 'application/pdf') {
        const pdfBuffer = await this.downloadGDriveFile(file.id, resourceKey);
        const pngBuffer = await this.convertPdfFirstPageToPng(pdfBuffer);
        const filename = `gdrive-${file.id}-preview.png`;
        const previewUrl = await this.uploadPreviewImage(pngBuffer, filename);

        return {
          previewUrl,
          metadata: { source: 'pdf-render', originalMimeType: file.mimeType },
        };
      }

      // Handle image files
      if (file.mimeType.startsWith('image/')) {
        const imageBuffer = await this.downloadGDriveFile(file.id, resourceKey);
        const filename = `gdrive-${file.id}-${file.name}`;
        const previewUrl = await this.uploadPreviewImage(
          imageBuffer,
          filename,
          file.mimeType,
        );

        return {
          previewUrl,
          metadata: {
            source: 'image-download',
            originalMimeType: file.mimeType,
          },
        };
      }

      // Fallback to thumbnail if available
      if (file.thumbnailLink) {
        return {
          previewUrl: file.thumbnailLink,
          metadata: {
            source: 'google-thumbnail-fallback',
            mimeType: file.mimeType,
          },
        };
      }

      throw new Error(
        'No preview generation method available for this file type',
      );
    } catch (error) {
      this.logger.error(
        `Failed to generate preview for ${file.name}: ${error.message}`,
      );
      throw new InternalServerErrorException('Failed to generate file preview');
    }
  }

  /**
   * Convert PDF first page to PNG buffer
   */
  private async convertPdfFirstPageToPng(
    pdfBuffer: Buffer,
    width: number = 1000,
  ): Promise<Buffer> {
    try {
      // Load PDF document
      const pdfDocument = await pdfjsLib.getDocument({
        data: new Uint8Array(pdfBuffer),
        useSystemFonts: true,
      }).promise;

      if (pdfDocument.numPages === 0) {
        throw new Error('PDF has no pages');
      }

      // Get first page
      const page = await pdfDocument.getPage(1);
      const viewport = page.getViewport({ scale: 1 });

      // Calculate scale to achieve desired width
      const scale = width / viewport.width;
      const scaledViewport = page.getViewport({ scale });

      // Create canvas
      const canvas = createCanvas(scaledViewport.width, scaledViewport.height);
      const canvasContext = canvas.getContext('2d');

      // Render page to canvas
      const renderContext = {
        canvasContext: canvasContext as any,
        viewport: scaledViewport,
        canvas: canvas as any, // Required by pdfjs for Node.js canvas rendering
      };

      await page.render(renderContext).promise;

      // Convert canvas to PNG buffer
      return canvas.toBuffer('image/png');
    } catch (error) {
      this.logger.error(`Failed to convert PDF to PNG: ${error.message}`);
      throw new InternalServerErrorException('Failed to convert PDF to PNG');
    }
  }

  /**
   * Upload preview image to storage
   */
  private async uploadPreviewImage(
    buffer: Buffer,
    filename: string,
    mimeType: string = 'image/png',
  ): Promise<string> {
    try {
      // Create mock MulterFile for StorageService compatibility
      const mockFile = {
        buffer,
        originalname: filename,
        mimetype: mimeType,
      } as any;

      // Upload using StorageService
      const uploadResult = await this.storageService.uploadFile(
        mockFile,
        'public',
        STORAGE_FOLDERS.MEDIA,
      );

      return uploadResult.publicUrl;
    } catch (error) {
      this.logger.error(`Failed to upload preview image: ${error.message}`);
      throw new InternalServerErrorException(
        'Failed to upload preview to storage',
      );
    }
  }

  /**
   * Check if file type is a Google Workspace file
   */
  private isGoogleWorkspaceFile(mimeType: string): boolean {
    const googleMimeTypes = [
      'application/vnd.google-apps.document',
      'application/vnd.google-apps.spreadsheet',
      'application/vnd.google-apps.presentation',
      'application/vnd.google-apps.drawing',
      'application/vnd.google-apps.form',
      'application/vnd.google-apps.script',
    ];

    return googleMimeTypes.includes(mimeType);
  }
}
