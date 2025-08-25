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
import { ApiTags } from '@nestjs/swagger';
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
import { EventsEmitter } from 'src/utils/events/events.emitter';
import { EmailType } from 'src/utils/email/constants/email.enum';
import { EmailPayloadDto } from 'src/utils/email/dto/email-payload.dto';
import { ResponseDto } from 'src/utils/globalDto/response.dto';

@ApiTags('Reviews')
@Controller('review/moderators')
@UseGuards(RolesGuard)
@Roles(UserRoleEnum.ADMIN)
export class ModeratorReviewController {
  constructor(
    private readonly userService: UserService,
    private readonly moderatorService: ModeratorService,
    private readonly eventsEmitter: EventsEmitter,
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
    } else if (reviewActionDto.action === ApprovalStatus.APPROVED) {
      // Update the user's role to moderator if approved
      await this.userService.update(id, { role: UserRoleEnum.MODERATOR });
      // Note: No email notification for approval as per current pattern
    }

    return ResponseDto.createSuccessResponse(
      `Moderator request ${reviewActionDto.action} successfully`,
      { id },
    );
  }
}
