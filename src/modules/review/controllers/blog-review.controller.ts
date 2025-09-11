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
} from '@app/common/types/db.types';
import { BlogService } from 'src/modules/blog/blog.service';
import { ResponseDto } from '@app/common/dto/response.dto';
import { EventsEmitter } from '@app/common/modules/events/events.emitter';
import { EmailType } from 'src/utils/email/constants/email.enum';
import { EmailPayloadDto } from 'src/utils/email/dto/email-payload.dto';
import { UserService } from 'src/modules/user/user.service';
@Controller('review/blogs')
@UseGuards(RolesGuard)
@Roles([UserRoleEnum.ADMIN, UserRoleEnum.MODERATOR])
export class BlogReviewController {
  constructor(
    private readonly blogService: BlogService,
    private readonly userService: UserService,
    private readonly eventsEmitter: EventsEmitter,
  ) {}

  @Get()
  async findAll(
    @Query('status') reviewStatus?: ApprovalStatus,
    @Query('page') page?: number,
    @Query('query') query?: string,
  ) {
    const result = await this.blogService.findAllPaginated(
      {
        reviewStatus,
        page,
        query,
      },
      true,
    ); // Pass true for includeReviewer
    return ResponseDto.createSuccessResponse(
      'Blogs retrieved successfully',
      result,
    );
  }

  @Get('count')
  async getCount(@Query('departmentId') departmentId?: string) {
    const result = await this.blogService.countBlogsByStatus(departmentId);
    return ResponseDto.createSuccessResponse(
      'Blogs count retrieved successfully',
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

    const blog = await this.blogService.findOne(id);
    if (!blog) {
      throw new NotFoundException('Blog not found');
    }

    const result = await this.blogService.review(id, {
      reviewStatus: reviewActionDto.action,
      reviewedById: reviewer.id,
    });

    // Get blog creator details for notification
    const creator = await this.userService.findOne(blog.creatorId);

    // Send notification based on review status
    if (reviewActionDto.action === ApprovalStatus.REJECTED) {
      const emailPayload: EmailPayloadDto = {
        to: creator.email,
        type: EmailType.BLOG_REJECTION,
        context: {
          userName: `${creator.firstName} ${creator.lastName}`,
          blogTitle: blog.title,
          comment: reviewActionDto.comment || 'No specific reason provided',
        },
      };
      this.eventsEmitter.sendEmail(emailPayload);
    }

    return ResponseDto.createSuccessResponse(
      `Blog ${reviewActionDto.action} successfully`,
      result,
    );
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: Request) {
    const reviewer = req.user as UserEntity;

    const blog = await this.blogService.findOne(id);
    if (!blog) {
      throw new NotFoundException('Blog not found');
    }

    await this.blogService.remove(id, reviewer.id);

    // Get blog creator details for notification
    const creator = await this.userService.findOne(blog.creatorId);

    // Note: No email notification for deletion as per current pattern

    return ResponseDto.createSuccessResponse('Blog deleted successfully', {
      id,
    });
  }
}
