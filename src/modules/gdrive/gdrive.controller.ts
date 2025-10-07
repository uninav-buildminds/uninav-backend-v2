import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import { GDriveService } from './gdrive.service';
import { Response } from 'express';

@Controller('gdrive')
export class GDriveController {
  constructor(private readonly service: GDriveService) {}

  @Get('thumbnail/:fileId')
  async proxyThumbnail(
    @Param('fileId') fileId: string,
    @Query('sz') sz: string = 's200',
    @Res() res: Response,
  ) {
    const streamResult = await this.service.streamThumbnail(fileId, sz);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    if (streamResult.contentType) {
      res.setHeader('Content-Type', streamResult.contentType);
    }
    streamResult.stream.pipe(res);
  }
}
