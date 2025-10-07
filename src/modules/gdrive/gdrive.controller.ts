import { Controller, Get, Param } from '@nestjs/common';
import { GDriveService } from './gdrive.service';

@Controller('gdrive')
export class GDriveController {
  constructor(private readonly service: GDriveService) {}

  @Get('thumbnail/:fileId')
  async getThumbnailLink(@Param('fileId') fileId: string) {
    const url = await this.service.getThumbnailLink(fileId);
    return {
      message: 'Thumbnail URL',
      data: { url },
    };
  }
}
