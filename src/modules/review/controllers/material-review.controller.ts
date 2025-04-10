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
import { RolesGuard } from 'src/guards/roles.guard';
import { Roles } from 'src/utils/decorators/roles.decorator';
import {
  ApprovalStatus,
  UserRoleEnum,
  UserEntity,
} from 'src/utils/types/db.types';
import { MaterialService } from 'src/modules/material/material.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ResponseDto } from 'src/utils/globalDto/response.dto';
import { EVENTS } from 'src/utils/events/events.enum';
import { UserService } from 'src/modules/user/user.service';

@Controller('review/materials')
@UseGuards(RolesGuard)
@Roles(UserRoleEnum.ADMIN, UserRoleEnum.MODERATOR)
export class MaterialReviewController {
  constructor(
    private readonly materialService: MaterialService,
    private readonly userService: UserService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Get()
  async findAll(@Query('status') status?: ApprovalStatus) {
    return this.materialService.findAll({ reviewStatus: status });
  }

  @Post(':id/review')
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
      this.eventEmitter.emit(EVENTS.MATERIAL_REJECTED, {
        materialId: id,
        creatorEmail: creator.email,
        creatorName: `${creator.firstName} ${creator.lastName}`,
        materialLabel: material.label,
        comment: reviewActionDto.comment || 'No specific reason provided',
      });
    } else if (reviewActionDto.action === ApprovalStatus.APPROVED) {
      this.eventEmitter.emit(EVENTS.MATERIAL_APPROVED, {
        materialId: id,
        creatorEmail: creator.email,
        creatorName: `${creator.firstName} ${creator.lastName}`,
        materialLabel: material.label,
      });
    }

    return ResponseDto.createSuccessResponse(
      `Material ${reviewActionDto.action} successfully`,
      result,
    );
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const material = await this.materialService.findOne(id);
    if (!material) {
      throw new NotFoundException('Material not found');
    }

    // Get material creator details for notification
    const creator = await this.userService.findOne(material.creatorId);

    // Delete the material
    await this.materialService.remove(id);

    // Notify creator about deletion
    this.eventEmitter.emit(EVENTS.MATERIAL_DELETED, {
      creatorEmail: creator.email,
      creatorName: `${creator.firstName} ${creator.lastName}`,
      materialLabel: material.label,
    });

    return { message: 'Material deleted successfully' };
  }
}
