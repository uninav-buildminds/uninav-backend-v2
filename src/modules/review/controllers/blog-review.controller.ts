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
import { BlogService } from 'src/modules/blog/blog.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ResponseDto } from 'src/utils/globalDto/response.dto';
import { EVENTS } from 'src/utils/events/events.enum';
import { UserService } from 'src/modules/user/user.service';

@Controller('review/blogs')
@UseGuards(RolesGuard)
@Roles(UserRoleEnum.ADMIN, UserRoleEnum.MODERATOR)
export class BlogReviewController {
  constructor(
    private readonly blogService: BlogService,
    private readonly userService: UserService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Get()
  async findAll(@Query('status') status?: ApprovalStatus) {
    return this.blogService.findWithFilters({ reviewStatus: status });
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
        'Only admins and moderators can review blogs',
      );
    }

    const blog = await this.blogService.findOne(id);
    if (!blog) {
      throw new NotFoundException('Blog not found');
    }

    const result = await this.blogService.review(id, {
      reviewStatus: reviewActionDto.action,
      reviewedById: reviewer.id,
      reviewComment: reviewActionDto.comment,
    });

    // Get blog creator details for notification
    const creator = await this.userService.findOne(blog.creatorId);

    // Send notification based on review status
    if (reviewActionDto.action === ApprovalStatus.REJECTED) {
      this.eventEmitter.emit(EVENTS.BLOG_REJECTED, {
        blogId: id,
        creatorEmail: creator.email,
        creatorName: `${creator.firstName} ${creator.lastName}`,
        blogTitle: blog.title,
        comment: reviewActionDto.comment || 'No specific reason provided',
      });
    } else if (reviewActionDto.action === ApprovalStatus.APPROVED) {
      this.eventEmitter.emit(EVENTS.BLOG_APPROVED, {
        blogId: id,
        creatorEmail: creator.email,
        creatorName: `${creator.firstName} ${creator.lastName}`,
        blogTitle: blog.title,
      });
    }

    return ResponseDto.createSuccessResponse(
      `Blog ${reviewActionDto.action} successfully`,
      result,
    );
  }

  @Post(':id/delete')
  async remove(@Param('id') id: string, @Req() req: Request) {
    const reviewer = req.user as UserEntity;
    if (
      !reviewer ||
      (reviewer.role !== UserRoleEnum.ADMIN &&
        reviewer.role !== UserRoleEnum.MODERATOR)
    ) {
      throw new UnauthorizedException(
        'Only admins and moderators can delete blogs',
      );
    }

    const blog = await this.blogService.findOne(id);
    if (!blog) {
      throw new NotFoundException('Blog not found');
    }

    await this.blogService.remove(id, reviewer.id);

    // Get blog creator details for notification
    const creator = await this.userService.findOne(blog.creatorId);

    this.eventEmitter.emit(EVENTS.BLOG_DELETED, {
      blogId: id,
      creatorEmail: creator.email,
      creatorName: `${creator.firstName} ${creator.lastName}`,
      blogTitle: blog.title,
      reviewerId: reviewer.id,
    });

    return ResponseDto.createSuccessResponse('Blog deleted successfully', {
      id,
    });
  }
}
