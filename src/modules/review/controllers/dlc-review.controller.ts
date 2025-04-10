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
  ParseIntPipe,
} from '@nestjs/common';
import { ReviewActionDto } from '../dto/review-action.dto';
import { RolesGuard } from 'src/guards/roles.guard';
import { Roles } from 'src/utils/decorators/roles.decorator';
import {
  UserRoleEnum,
  ApprovalStatus,
  UserEntity,
} from 'src/utils/types/db.types';
import { CoursesService } from 'src/modules/courses/courses.service';
import { Request } from 'express';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EVENTS } from 'src/utils/events/events.enum';
import { UserService } from 'src/modules/user/user.service';
import { ResponseDto } from 'src/utils/globalDto/response.dto';

@Controller('review/dlc')
@UseGuards(RolesGuard)
@Roles(UserRoleEnum.ADMIN, UserRoleEnum.MODERATOR)
export class DLCReviewController {
  constructor(
    private readonly coursesService: CoursesService,
    private readonly userService: UserService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Get()
  async findAll(
    @Query('status') status?: ApprovalStatus,
    @Query('page') page?: number,
  ) {
    return this.coursesService.findAllPaginated({
      reviewStatus: status,
      page,
    });
  }

  @Post(':departmentId/:courseId/:level/review')
  async review(
    @Param('departmentId') departmentId: string,
    @Param('courseId') courseId: string,
    @Param('level', ParseIntPipe) level: number,
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
        'Only admins and moderators can review department level courses',
      );
    }

    const course = await this.coursesService.findById(courseId);
    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const result = await this.coursesService.reviewDepartmentLevelCourse(
      departmentId,
      courseId,
      level,
      {
        reviewStatus: reviewActionDto.action,
        reviewedById: reviewer.id,
      },
    );

    // Get course creator details for notification
    const creator = await this.userService.findOne(course.creatorId);

    // Send notification based on review status
    if (reviewActionDto.action === ApprovalStatus.REJECTED) {
      this.eventEmitter.emit(EVENTS.DLC_REJECTED, {
        courseId,
        departmentId,
        level,
        creatorEmail: creator.email,
        creatorName: `${creator.firstName} ${creator.lastName}`,
        courseName: course.courseName,
        comment: reviewActionDto.comment || 'No specific reason provided',
      });
    } else if (reviewActionDto.action === ApprovalStatus.APPROVED) {
      this.eventEmitter.emit(EVENTS.DLC_APPROVED, {
        courseId,
        departmentId,
        level,
        creatorEmail: creator.email,
        creatorName: `${creator.firstName} ${creator.lastName}`,
        courseName: course.courseName,
      });
    }

    return ResponseDto.createSuccessResponse(
      `Department Level Course ${reviewActionDto.action} successfully`,
      result,
    );
  }

  @Delete(':departmentId/:courseId/:level')
  async remove(
    @Param('departmentId') departmentId: string,
    @Param('courseId') courseId: string,
    @Param('level', ParseIntPipe) level: number,
    @Req() req: Request,
  ) {
    const reviewer = req.user as UserEntity;
    if (
      !reviewer ||
      (reviewer.role !== UserRoleEnum.ADMIN &&
        reviewer.role !== UserRoleEnum.MODERATOR)
    ) {
      throw new UnauthorizedException(
        'Only admins and moderators can delete department level courses',
      );
    }

    const course = await this.coursesService.findById(courseId);
    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Get course creator details for notification
    const creator = await this.userService.findOne(course.creatorId);

    // Delete this dlc
    await this.coursesService.deleteDepartmentLevelCourse(
      departmentId,
      courseId,
      level,
    );

    this.eventEmitter.emit(EVENTS.DLC_DELETED, {
      courseId,
      departmentId,
      level,
      creatorEmail: creator.email,
      creatorName: `${creator.firstName} ${creator.lastName}`,
      courseName: course.courseName,
      reviewerId: reviewer.id,
    });

    return ResponseDto.createSuccessResponse(
      'Department Level Course deleted successfully',
      {
        departmentId,
        courseId,
        level,
      },
    );
  }
}
