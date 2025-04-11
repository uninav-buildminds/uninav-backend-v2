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
import { RolesGuard } from 'src/guards/roles.guard';
import { Roles } from 'src/utils/decorators/roles.decorator';
import {
  UserRoleEnum,
  ApprovalStatus,
  UserEntity,
} from 'src/utils/types/db.types';
import { UserService } from 'src/modules/user/user.service';
import { ModeratorService } from 'src/modules/moderator/moderator.service';
import { Request } from 'express';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EVENTS } from 'src/utils/events/events.enum';
import { ResponseDto } from 'src/utils/globalDto/response.dto';

@Controller('review/moderators')
@UseGuards(RolesGuard)
@Roles(UserRoleEnum.ADMIN)
export class ModeratorReviewController {
  constructor(
    private readonly userService: UserService,
    private readonly moderatorService: ModeratorService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Get()
  async findAll(@Query('status') status?: ApprovalStatus) {
    const moderators = await this.moderatorService.findAll(status);
    return ResponseDto.createSuccessResponse(
      'Moderator requests retrieved successfully',
      moderators,
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
      // Emit event for rejection notification
      this.eventEmitter.emit(EVENTS.MODERATOR_REQUEST_REJECTED, {
        userId: id,
        comment: reviewActionDto.comment,
      });
    } else if (reviewActionDto.action === ApprovalStatus.APPROVED) {
      // Update the user's role to moderator if approved
      await this.userService.update(id, { role: UserRoleEnum.MODERATOR });

      // Emit event for approval notification
      this.eventEmitter.emit(EVENTS.MODERATOR_REQUEST_APPROVED, {
        userId: id,
      });
    }

    return ResponseDto.createSuccessResponse(
      `Moderator request ${reviewActionDto.action} successfully`,
      { id },
    );
  }
}
