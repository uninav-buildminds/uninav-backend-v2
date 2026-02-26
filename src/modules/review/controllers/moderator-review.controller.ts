import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Query,
  UnauthorizedException,
  Req,
  NotFoundException,
} from '@nestjs/common';
import { ReviewActionDto } from '../dto/review-action.dto';
import { RolesGuard } from '@app/common/guards/roles.guard';
import { Roles } from '@app/common/decorators/roles.decorator';
import {
  UserRoleEnum,
  ApprovalStatus,
  UserEntity,
} from '@app/common/types/db.types';
import { UserService } from 'src/modules/user/user.service';
import { ModeratorService } from 'src/modules/user/submodules/moderator/moderator.service';
import { Request } from 'express';
import { EventsEmitter } from '@app/common/modules/events/events.emitter';
import { EmailType } from 'src/utils/email/constants/email.enum';
import { EmailPayloadDto } from 'src/utils/email/dto/email-payload.dto';
import { ResponseDto } from '@app/common/dto/response.dto';
import { NotificationsService } from 'src/modules/notifications/notifications.service';
@Controller('review/moderators')
@UseGuards(RolesGuard)
@Roles([UserRoleEnum.ADMIN])
export class ModeratorReviewController {
  constructor(
    private readonly userService: UserService,
    private readonly moderatorService: ModeratorService,
    private readonly eventsEmitter: EventsEmitter,
    private readonly notificationsService: NotificationsService,
  ) {}

  @Get()
  async findAll(
    @Query('status') status?: ApprovalStatus,
    @Query('page') page?: number,
    @Query('query') query?: string,
  ) {
    const result = await this.moderatorService.findAllPaginated({
      status,
      page,
      query,
    });
    return ResponseDto.createSuccessResponse(
      'Moderator applications retrieved successfully',
      result,
    );
  }

  @Get('count')
  async getCount(@Query('departmentId') departmentId?: string) {
    const result =
      await this.moderatorService.countModeratorsByStatus(departmentId);
    return ResponseDto.createSuccessResponse(
      'Moderator requests count retrieved successfully',
      result,
    );
  }

  @Post('review/:id')
  async review(
    @Param('id') id: string,
    @Body() reviewActionDto: ReviewActionDto,
    @Req() req: Request,
  ) {
    const admin = req.user as UserEntity;

    const moderator = await this.moderatorService.findById(id);
    if (!moderator) {
      throw new NotFoundException('Moderator request not found');
    }

    // If rejected, revert role back to student
    if (reviewActionDto.action === ApprovalStatus.REJECTED) {
      await this.userService.update(id, { role: UserRoleEnum.STUDENT });
      await this.moderatorService.delete(id);

      // Get user details for email notification
      const user = await this.userService.findOne(id);
      if (user) {
        const emailPayload: EmailPayloadDto = {
          to: user.email,
          type: EmailType.MODERATOR_REJECTION,
          context: {
            comment: reviewActionDto.comment || 'No specific reason provided',
          },
        };
        this.eventsEmitter.sendEmail(emailPayload);
      }

      // In-app notification for moderator rejection
      await this.notificationsService.create(
        id,
        'moderator_rejected',
        'Moderator Request Rejected',
        reviewActionDto.comment
          ? `Your moderator request was rejected: ${reviewActionDto.comment}`
          : 'Your moderator request was rejected.',
      );
    } else if (reviewActionDto.action === ApprovalStatus.APPROVED) {
      // Update the user's role to moderator if approved
      await this.userService.update(id, { role: UserRoleEnum.MODERATOR });
      // Note: No email notification for approval as per current pattern
      // In-app notification for moderator approval
      await this.notificationsService.create(
        id,
        'moderator_approved',
        'Moderator Request Approved',
        'Congratulations! Your moderator request has been approved.',
      );
    }

    return ResponseDto.createSuccessResponse(
      `Moderator request ${reviewActionDto.action} successfully`,
      { id },
    );
  }
}
