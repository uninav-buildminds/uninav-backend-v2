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
import { CoursesService } from 'src/modules/courses/courses.service';
import { Request } from 'express';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EVENTS } from 'src/utils/events/events.enum';
import { UserService } from 'src/modules/user/user.service';
import { ResponseDto } from 'src/utils/globalDto/response.dto';

@Controller('review/courses')
@UseGuards(RolesGuard)
@Roles(UserRoleEnum.ADMIN, UserRoleEnum.MODERATOR)
export class CourseReviewController {
  constructor(
    private readonly coursesService: CoursesService,
    private readonly userService: UserService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Get()
  async findAll(
    @Query('status') status?: ApprovalStatus,
    @Query('page') page?: number,
    @Query('query') query?: string,
  ) {
    const result = await this.coursesService.findAll({
      reviewStatus: status,
      page,
      query,
    });
    return ResponseDto.createSuccessResponse(
      'Courses retrieved successfully',
      result,
    );
  }

  @Get('count')
  async getCount(@Query('departmentId') departmentId?: string) {
    const result = await this.coursesService.countCoursesByStatus(departmentId);
    return ResponseDto.createSuccessResponse(
      'Courses count retrieved successfully',
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
        'Only admins and moderators can review courses',
      );
    }

    const course = await this.coursesService.findById(id);
    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const result = await this.coursesService.review(id, {
      reviewStatus: reviewActionDto.action,
      reviewedById: reviewer.id,
    });

    // Get course creator details for notification
    const creator = await this.userService.findOne(course.creatorId);

    // Send notification based on review status
    if (reviewActionDto.action === ApprovalStatus.REJECTED) {
      this.eventEmitter.emit(EVENTS.COURSE_REJECTED, {
        courseId: id,
        creatorEmail: creator.email,
        creatorName: `${creator.firstName} ${creator.lastName}`,
        courseName: course.courseName,
        comment: reviewActionDto.comment || 'No specific reason provided',
      });
    } else if (reviewActionDto.action === ApprovalStatus.APPROVED) {
      this.eventEmitter.emit(EVENTS.COURSE_APPROVED, {
        courseId: id,
        creatorEmail: creator.email,
        creatorName: `${creator.firstName} ${creator.lastName}`,
        courseName: course.courseName,
      });
    }

    return ResponseDto.createSuccessResponse(
      `Course ${reviewActionDto.action} successfully`,
      result,
    );
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: Request) {
    const reviewer = req.user as UserEntity;

    const course = await this.coursesService.findById(id);
    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Get course creator details for notification
    const creator = await this.userService.findOne(course.creatorId);

    await this.coursesService.remove(id, reviewer.id);

    this.eventEmitter.emit(EVENTS.COURSE_DELETED, {
      courseId: id,
      creatorEmail: creator.email,
      creatorName: `${creator.firstName} ${creator.lastName}`,
      courseName: course.courseName,
      reviewerId: reviewer.id,
    });

    return ResponseDto.createSuccessResponse('Course deleted successfully', {
      id,
    });
  }
}
