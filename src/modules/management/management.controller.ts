import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { RolesGuard } from '@app/common/guards/roles.guard';
import { Roles } from '@app/common/decorators/roles.decorator';
import { UserRoleEnum, UserEntity } from '@app/common/types/db.types';
import { ResponseDto } from '@app/common/dto/response.dto';
import { MaterialService } from 'src/modules/material/services/material.service';
import { BlogService } from 'src/modules/blog/blog.service';
import { CoursesService } from 'src/modules/courses/courses.service';
import { UserService } from 'src/modules/user/user.service';

@Controller('management')
@UseGuards(RolesGuard)
@Roles([UserRoleEnum.ADMIN, UserRoleEnum.MODERATOR])
export class ManagementController {
  constructor(
    private readonly materialService: MaterialService,
    private readonly blogService: BlogService,
    private readonly coursesService: CoursesService,
    private readonly userService: UserService,
  ) {}

  @Get('stats')
  async getManagementStats(@Req() req: Request) {
    const user = req.user as UserEntity;

    try {
      // Get counts for different content types
      const [materialsCount, blogsCount, coursesCount, totalUsers] =
        await Promise.all([
          this.materialService.countMaterialsByStatus(),
          this.blogService.countBlogsByStatus(),
          this.coursesService.countCoursesByStatus(),
          this.userService.getTotalUsersCount(),
        ]);

      // Calculate totals
      const pendingReviews =
        (materialsCount.pending || 0) +
        (blogsCount.pending || 0) +
        (coursesCount.pending || 0);

      const approvedToday =
        (materialsCount.approved || 0) +
        (blogsCount.approved || 0) +
        (coursesCount.approved || 0);

      const rejectedItems =
        (materialsCount.rejected || 0) +
        (blogsCount.rejected || 0) +
        (coursesCount.rejected || 0);

      // Mock total views for now - this would come from analytics
      const totalViews = 12400;

      const stats = {
        pendingReviews,
        approvedToday,
        rejectedItems,
        totalViews,
        totalUsers: totalUsers || 0,
      };

      return ResponseDto.createSuccessResponse(
        'Management stats retrieved successfully',
        stats,
      );
    } catch (error) {
      return ResponseDto.createErrorResponse(
        'Failed to retrieve management stats',
        error.message,
      );
    }
  }

  @Get('review-counts')
  async getReviewCounts(@Req() req: Request) {
    try {
      const [materialsCount, blogsCount, coursesCount] = await Promise.all([
        this.materialService.countMaterialsByStatus(),
        this.blogService.countBlogsByStatus(),
        this.coursesService.countCoursesByStatus(),
      ]);

      const reviewCounts = {
        materials: {
          pending: materialsCount.pending || 0,
          approved: materialsCount.approved || 0,
          rejected: materialsCount.rejected || 0,
        },
        blogs: {
          pending: blogsCount.pending || 0,
          approved: blogsCount.approved || 0,
          rejected: blogsCount.rejected || 0,
        },
        courses: {
          pending: coursesCount.pending || 0,
          approved: coursesCount.approved || 0,
          rejected: coursesCount.rejected || 0,
        },
        dlc: {
          pending: 0, // DLC counts would be implemented separately
          approved: 0,
          rejected: 0,
        },
        adverts: {
          pending: 0, // Advert counts would be implemented separately
          approved: 0,
          rejected: 0,
        },
        moderators: {
          pending: 0, // Moderator application counts would be implemented separately
          approved: 0,
          rejected: 0,
        },
      };

      return ResponseDto.createSuccessResponse(
        'Review counts retrieved successfully',
        reviewCounts,
      );
    } catch (error) {
      return ResponseDto.createErrorResponse(
        'Failed to retrieve review counts',
        error.message,
      );
    }
  }
}
