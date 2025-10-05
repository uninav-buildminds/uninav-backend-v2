import {
  Controller,
  Get,
  Query,
  UseGuards,
  Req,
  Patch,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { RolesGuard } from '@app/common/guards/roles.guard';
import { NotificationsService } from './notifications.service';
import { ResponseDto } from '@app/common/dto/response.dto';
import { Request } from 'express';

@Controller('notifications')
@UseGuards(RolesGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async list(
    @Req() req: Request,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('query') query?: string,
    @Query('status') status?: 'read' | 'unread',
  ) {
    const user = req.user as any;
    const result = await this.notificationsService.list(user.id, {
      page,
      limit,
      query,
      status,
    });
    return ResponseDto.createSuccessResponse(
      'Notifications retrieved successfully',
      result,
    );
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  async markRead(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as any;
    const item = await this.notificationsService.markRead(user.id, id);
    return ResponseDto.createSuccessResponse('Notification marked read', item);
  }

  @Patch('read-all')
  @HttpCode(HttpStatus.OK)
  async markAllRead(@Req() req: Request) {
    const user = req.user as any;
    await this.notificationsService.markAllRead(user.id);
    return ResponseDto.createSuccessResponse(
      'All notifications marked read',
      true,
    );
  }
}
