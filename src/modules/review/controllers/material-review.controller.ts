import {
  Controller,
  Post,
  Param,
  Body,
  UseGuards,
  Req,
  Get,
  Query,
  UnauthorizedException,
  NotFoundException,
  Delete,
} from '@nestjs/common';
import { Request } from 'express';
import { ReviewActionDto } from '../dto/review-action.dto';
import { RolesGuard } from '@app/common/guards/roles.guard';
import { Roles } from '@app/common/decorators/roles.decorator';
import {
  ApprovalStatus,
  UserRoleEnum,
  UserEntity,
} from 'src/utils/types/db.types';
import { MaterialService } from 'src/modules/material/services/material.service';
import { ResponseDto } from '@app/common/dto/response.dto';
import { EventsEmitter } from '@app/common/modules/events/events.emitter';
import { EmailType } from 'src/utils/email/constants/email.enum';
import { EmailPayloadDto } from 'src/utils/email/dto/email-payload.dto';
import { UserService } from 'src/modules/user/user.service';
@Controller('review/materials')
@UseGuards(RolesGuard)
@Roles(UserRoleEnum.ADMIN, UserRoleEnum.MODERATOR)
export class MaterialReviewController {
  constructor(
    private readonly materialService: MaterialService,
    private readonly userService: UserService,
    private readonly eventsEmitter: EventsEmitter,
  ) {}

  @Get()
  async findAll(
    @Query('status') status?: ApprovalStatus,
    @Query('page') page?: number,
    @Query('query') query?: string,
  ) {
    const result = await this.materialService.findAllPaginated({
      reviewStatus: status,
      page,
      query,
      ignorePreference: true,
    });
    return ResponseDto.createSuccessResponse(
      'Materials retrieved successfully',
      result,
    );
  }

  @Get('count')
  async getCount(@Query('departmentId') departmentId?: string) {
    const result =
      await this.materialService.countMaterialsByStatus(departmentId);
    return ResponseDto.createSuccessResponse(
      'Materials count retrieved successfully',
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
    if (
      !reviewer ||
      (reviewer.role !== UserRoleEnum.ADMIN &&
        reviewer.role !== UserRoleEnum.MODERATOR)
    ) {
      throw new UnauthorizedException(
        'Only admins and moderators can review materials',
      );
    }

    const material = await this.materialService.findOne(id);
    if (!material) {
      throw new NotFoundException('Material not found');
    }

    const result = await this.materialService.review(id, {
      reviewStatus: reviewActionDto.action,
      reviewedById: reviewer.id,
    });

    // Get material creator details for notification
    const creator = await this.userService.findOne(material.creatorId);

    // Send notification based on review status
    if (reviewActionDto.action === ApprovalStatus.REJECTED) {
      const emailPayload: EmailPayloadDto = {
        to: creator.email,
        type: EmailType.MATERIAL_REJECTION,
        context: {
          userName: `${creator.firstName} ${creator.lastName}`,
          materialLabel: material.label,
          comment: reviewActionDto.comment || 'No specific reason provided',
        },
      };
      this.eventsEmitter.sendEmail(emailPayload);
    }

    return ResponseDto.createSuccessResponse(
      `Material ${reviewActionDto.action} successfully`,
      result,
    );
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: Request) {
    const admin = req.user as UserEntity;
    const material = await this.materialService.findOne(id);
    if (!material) {
      throw new NotFoundException('Material not found');
    }

    // Get material creator details for notification
    const creator = await this.userService.findOne(material.creatorId);

    // Delete the material
    await this.materialService.remove(id, admin.id);

    // Note: No email notification for deletion as per current pattern

    return ResponseDto.createSuccessResponse('Material deleted successfully', {
      id,
    });
  }
}
