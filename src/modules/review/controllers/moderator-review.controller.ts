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
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Get()
  async findAll(@Query('status') status?: ApprovalStatus) {
    // return this.userService.findAllModeratorRequests(status);
  }

  @Post(':id/review')
  async review(
    @Param('id') id: string,
    @Body() reviewActionDto: ReviewActionDto,
    @Req() req: Request,
  ) {
    const admin = req.user as UserEntity;
    if (!admin || admin.role !== UserRoleEnum.ADMIN) {
      throw new UnauthorizedException(
        'Only admins can review moderator requests',
      );
    }

    // const result = await this.userService.reviewModeratorRequest(id, {
    //   reviewStatus: reviewActionDto.action,
    //   reviewedById: admin.id,
    //   reviewComment: reviewActionDto.comment,
    // });

    // If rejected, revert role back to student
    if (reviewActionDto.action === ApprovalStatus.REJECTED) {
      await this.userService.update(id, { role: UserRoleEnum.STUDENT });

      // Emit event for rejection notification
      this.eventEmitter.emit(EVENTS.MODERATOR_REQUEST_REJECTED, {
        userId: id,
        comment: reviewActionDto.comment,
      });
    } else if (reviewActionDto.action === ApprovalStatus.APPROVED) {
      // Emit event for approval notification
      this.eventEmitter.emit(EVENTS.MODERATOR_REQUEST_APPROVED, {
        userId: id,
      });
    }

    // return ResponseDto.createSuccessResponse(
    //   `Moderator request ${reviewActionDto.action} successfully`,
    //   result,
    // );
  }
}
