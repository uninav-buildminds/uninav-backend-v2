import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Query,
  Req,
  NotFoundException,
} from '@nestjs/common';
import { ReviewActionDto } from '../dto/review-action.dto';
import { RolesGuard } from 'src/guards/roles.guard';
import { Roles } from 'src/utils/decorators/roles.decorator';
import {
  UserRoleEnum,
  ApprovalStatus,
  UserEntity,
} from 'src/utils/types/db.types';
import { UserService } from 'src/modules/user/user.service';
import { AdvertService } from 'src/modules/advert/advert.service';
import { Request } from 'express';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EVENTS } from 'src/utils/events/events.enum';
import { ResponseDto } from 'src/utils/globalDto/response.dto';

@Controller('review/adverts')
@UseGuards(RolesGuard)
@Roles(UserRoleEnum.ADMIN, UserRoleEnum.MODERATOR)
export class AdvertReviewController {
  constructor(
    private readonly advertService: AdvertService,
    private readonly userService: UserService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Get()
  async findAll(
    @Query('status') status?: ApprovalStatus,
    @Query('page') page?: number,
    @Query('query') query?: string,
  ) {
    const result = await this.advertService.findAllPaginated(
      {
        reviewStatus: status,
        page,
        query,
      },
      true,
    ); // Pass true for includeReviewer
    return ResponseDto.createSuccessResponse(
      'Adverts retrieved successfully',
      result,
    );
  }

  @Get('count')
  async getCount(@Query('departmentId') departmentId?: string) {
    const result = await this.advertService.countAdvertsByStatus(departmentId);
    return ResponseDto.createSuccessResponse(
      'Adverts count retrieved successfully',
      result,
    );
  }

  @Post('review/:id')
  async review(
    @Param('id') id: string,
    @Body() reviewActionDto: ReviewActionDto,
    @Req() req: Request,
  ) {
    const reviewer = req.user as UserEntity;
    const advert = await this.advertService.findOne(id);
    if (!advert) {
      throw new NotFoundException('Advertisement not found');
    }

    const result = await this.advertService.review(id, {
      reviewStatus: reviewActionDto.action,
      reviewedById: reviewer.id,
    });

    // Get advert creator details for notification
    const creator = await this.userService.findOne(advert.creatorId);

    // Send notification based on review status
    if (reviewActionDto.action === ApprovalStatus.REJECTED) {
      this.eventEmitter.emit(EVENTS.ADVERT_REJECTED, {
        advertId: id,
        creatorEmail: creator.email,
        creatorName: `${creator.firstName} ${creator.lastName}`,
        advertLabel: advert.label,
        comment: reviewActionDto.comment || 'No specific reason provided',
      });
    } else if (reviewActionDto.action === ApprovalStatus.APPROVED) {
      this.eventEmitter.emit(EVENTS.ADVERT_APPROVED, {
        advertId: id,
        creatorEmail: creator.email,
        creatorName: `${creator.firstName} ${creator.lastName}`,
        advertLabel: advert.label,
      });
    }

    return ResponseDto.createSuccessResponse(
      `Advertisement ${reviewActionDto.action} successfully`,
      result,
    );
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: Request) {
    const admin = req.user as UserEntity;
    const advert = await this.advertService.findOne(id);

    if (!advert) {
      throw new NotFoundException('Advertisement not found');
    }

    await this.advertService.remove(id, admin.id);
    return ResponseDto.createSuccessResponse(
      'Advertisement deleted successfully',
      { id },
    );
  }
}
