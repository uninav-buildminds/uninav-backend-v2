import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { PointsService } from './points.service';
import { RolesGuard } from '@app/common/guards/roles.guard';
import { CurrentUser } from '@app/common/decorators/current-user.decorator';

@Controller('user/points')
@UseGuards(RolesGuard)
export class PointsController {
  constructor(private readonly pointsService: PointsService) {}

  /**
   * GET /user/points - Get user's points percentage
   */
  @Get()
  async getPoints(@CurrentUser() user: any) {
    return {
      status: 'success',
      data: {
        points: await this.pointsService.getPointsPercentage(user.id),
      },
    };
  }

  /**
   * GET /user/points/detailed - Get detailed points data
   */
  @Get('detailed')
  async getDetailedPoints(@CurrentUser() user: any) {
    return {
      status: 'success',
      data: await this.pointsService.getPointsData(user.id),
    };
  }

  /**
   * POST /user/points/allocate - Allocate reading points (called from client every 5 minutes)
   */
  @Post('allocate')
  async allocatePoints(@CurrentUser() user: any) {
    const result = await this.pointsService.allocateReadingPoints(user.id);
    return {
      status: 'success',
      data: result,
      message: result.allocated
        ? 'Points allocated successfully'
        : 'Points already allocated for today',
    };
  }
}

