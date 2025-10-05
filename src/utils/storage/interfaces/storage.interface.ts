export interface UploadOptions {
  fileName?: string;
  folder?: string;
  bucket: string;
}

export interface UploadResult {
  fileKey: string;
  url: string;
  size: number;
  mimeType: string;
  originalName: string;
  bucketType: 'public' | 'private';
  uploadedAt: Date;
}

export interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer: Buffer;
}

export interface IStorageProvider {
  uploadFile(file: MulterFile, options: UploadOptions): Promise<UploadResult>;
  getSignedFileUrl(
    fileKey: string,
    bucket: string,
    expiresIn?: number,
  ): Promise<string>;
  getPublicFileUrl(fileKey: string, bucket: string): string;
  deleteFile(fileKey: string, bucket: string): Promise<void>;
}

export type StorageProviderType = 'idrive' | 'cloudinary';
