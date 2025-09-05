import { IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

export class ProcessGDriveUrlDto {
  @IsNotEmpty()
  @IsUrl()
  @IsString()
  url: string;

  @IsOptional()
  @IsString()
  materialId?: string;
}

export interface PreviewResult {
  previewUrl: string;
  metadata: Record<string, any>;
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime?: string;
  thumbnailLink?: string;
  webViewLink?: string;
  parents?: string[];
}

export interface DriveUrlParsed {
  id: string;
  type: 'file' | 'folder';
  resourceKey?: string;
}
