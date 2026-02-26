import { Controller, Get, Query } from '@nestjs/common';
import { GDriveService } from './gdrive.service';

@Controller('gdrive')
export class GDriveController {
  constructor(private readonly service: GDriveService) {}

  @Get('key-rotation')
  async getNextKeyIndex(@Query('currentIndex') currentIndex?: string) {
    const current = currentIndex ? parseInt(currentIndex, 10) : undefined;
    const nextIndex = this.service.getNextKeyIndex(current);
    const totalKeys = this.service.getKeyCount();

    return {
      message: 'Next API key index',
      data: {
        nextIndex,
        totalKeys,
        hasKeys: totalKeys > 0,
      },
    };
  }
}
