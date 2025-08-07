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
import { ApiTags } from '@nestjs/swagger';
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

@ApiTags('DLCReview')
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
    @Query('page', ParseIntPipe) page?: number,
    @Query('query') query?: string,
  ) {
    const result = await this.coursesService.findDepartmentLevelCourses({
      reviewStatus: status,
      page,
      query,
    });

    return ResponseDto.createSuccessResponse(
      'Department level courses retrieved successfully',
      result,
    );
  }

  @Get('count')
  async getCount(@Query('departmentId') departmentId?: string) {
    const result =
      await this.coursesService.countDepartmentLevelCoursesByStatus(
        departmentId,
      );
    return ResponseDto.createSuccessResponse(
      'Department level courses count retrieved successfully',
      result,
    );
  }

  @Post('review/:departmentId/:courseId')
  async review(
    @Param('departmentId') departmentId: string,
    @Param('courseId') courseId: string,
    @Body() reviewActionDto: ReviewActionDto,
    @Req() req: Request,
  ) {
    const reviewer = req.user as UserEntity;

    const course = await this.coursesService.findById(courseId);
    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const result = await this.coursesService.reviewDepartmentLevelCourse(
      departmentId,
      courseId,
      {
        reviewStatus: reviewActionDto.action,
        reviewedById: reviewer.id,
      },
    );
    if (!course.creatorId) {
      // some courses created during seeding
      return ResponseDto.createSuccessResponse(
        `Department Level Course ${reviewActionDto.action} successfully`,
        result,
      );
    }
    const creator = await this.userService.findOne(course.creatorId);

    // Send notification based on review status
    if (reviewActionDto.action === ApprovalStatus.REJECTED) {
      this.eventEmitter.emit(EVENTS.DLC_REJECTED, {
        courseId,
        departmentId,
        level: result.level,
        creatorEmail: creator.email,
        creatorName: `${creator.firstName} ${creator.lastName}`,
        courseName: course.courseName,
        comment: reviewActionDto.comment || 'No specific reason provided',
      });
    } else if (reviewActionDto.action === ApprovalStatus.APPROVED) {
      this.eventEmitter.emit(EVENTS.DLC_APPROVED, {
        courseId,
        departmentId,
        level: result.level,
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

  @Delete(':departmentId/:courseId')
  async remove(
    @Param('departmentId') departmentId: string,
    @Param('courseId') courseId: string,
    @Req() req: Request,
  ) {
    const reviewer = req.user as UserEntity;

    const course = await this.coursesService.findById(courseId);
    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Get course creator details for notification
    const creator = await this.userService.findOne(course.creatorId);

    // Delete this dlc
    let dlc = await this.coursesService.deleteDepartmentLevelCourse(
      departmentId,
      courseId,
    );

    this.eventEmitter.emit(EVENTS.DLC_DELETED, {
      courseId,
      departmentId,
      level: dlc.level,
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
        level: dlc.level,
      },
    );
  }
}
