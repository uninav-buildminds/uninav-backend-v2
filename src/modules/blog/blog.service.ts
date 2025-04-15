import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { BlogRepository } from './blog.repository';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { StorageService } from 'src/storage/storage.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import {
  ApprovalStatus,
  BlogEntity,
  BlogTypeEnum,
  UserEntity,
  UserRoleEnum,
} from 'src/utils/types/db.types';
import { MulterFile } from 'src/utils/types';
import * as moment from 'moment-timezone';
import { BLOG_HEADING_IMG_URL_EXPIRY_DAYS } from 'src/utils/config/constants.config';
import { DataFormatter } from 'src/utils/helpers/data-formater.helper';
import { UserService } from 'src/modules/user/user.service';

@Injectable()
export class BlogService {
  private readonly logger = new Logger(BlogService.name);

  constructor(
    private readonly blogRepository: BlogRepository,
    private readonly storageService: StorageService,
    private readonly userService: UserService,
  ) {}

  async countBlogsByStatus(departmentId?: string) {
    return this.blogRepository.countByStatus(departmentId);
  }

  /**
   * Create a new blog with image and markdown content stored in B2 buckets
   */
  async create(
    createBlogDto: CreateBlogDto,
    user: UserEntity,
    headingImage?: MulterFile,
  ) {
    try {
      let headingImageUrl = '';
      let headingImageKey = null;
      if (headingImage) {
        // 1. Upload the heading image to B2 media bucket
        const { fileKey: headingImageKey } =
          await this.storageService.uploadBlogImage(headingImage);

        // Generate a signed URL for the heading image
        headingImageUrl = await this.storageService.getSignedUrl(
          headingImageKey,
          3600 * 24 * BLOG_HEADING_IMG_URL_EXPIRY_DAYS, // 7 days expiration
          false,
          'media',
        );
      }

      // 2. Store the blog body content in B2 blogs bucket
      const { publicUrl: bodyUrl, fileKey: bodyKey } =
        await this.storageService.uploadBlogContent(createBlogDto.body);

      // Set review status to approved if creator is admin/moderator
      const reviewStatus =
        user.role === UserRoleEnum.ADMIN || user.role === UserRoleEnum.MODERATOR
          ? ApprovalStatus.APPROVED
          : ApprovalStatus.PENDING;
      const reviewedById =
        reviewStatus === ApprovalStatus.APPROVED ? user.id : null;

      // 3. Create blog entry in database (without storing actual body content)
      const blogData = {
        creatorId: user.id,
        title: createBlogDto.title,
        description: createBlogDto.description,
        type: createBlogDto.type,
        headingImageAddress: headingImageUrl,
        bodyAddress: bodyUrl,
        headingImageKey,
        bodyKey,
        tags: createBlogDto.tags,
        reviewStatus,
        reviewedById,
      } as BlogEntity;

      let blog = await this.blogRepository.create(blogData);

      return DataFormatter.formatObject(blog, ['bodyAddress'], []);
    } catch (error) {
      this.logger.error(`Failed to create blog: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to create blog: ' + error.message);
    }
  }

  /**
   * Get paginated list of blogs with optional search and type filters
   */
  async findAllPaginated(
    options: {
      query?: string;
      page?: number;
      limit?: number;
      userId?: string;
      reviewStatus?: ApprovalStatus;
      type?: BlogTypeEnum;
    },
    includeReviewer?: boolean,
  ) {
    const page = options.page || 1;
    const limit = options.limit || 10;

    // Always sort by creation date, newest first
    return this.blogRepository.findAllPaginated(
      {
        ...options,
        page,
        limit,
      },
      includeReviewer,
    );
  }

  /**
   * Get a specific blog by ID with content and increment view counter
   */
  async findOne(id: string, incrementViewCount = true) {
    const blog = await this.blogRepository.findOne(id);

    if (!blog) {
      throw new NotFoundException(`Blog with ID ${id} not found`);
    }

    // Check if heading image URL has expired
    if (blog.headingImageKey) {
      const isExpired = moment(blog.updatedAt).isBefore(
        moment().subtract(BLOG_HEADING_IMG_URL_EXPIRY_DAYS, 'days'),
      );

      if (isExpired) {
        // Generate a new signed URL
        const headingImageUrl = await this.storageService.getSignedUrl(
          blog.headingImageKey,
          3600 * 24 * BLOG_HEADING_IMG_URL_EXPIRY_DAYS, // 7 days expiration
          false,
          'media',
        );

        // Update the blog with the new URL
        await this.blogRepository.update(id, {
          headingImageAddress: headingImageUrl,
        });

        // Update the URL in the current blog object
        blog.headingImageAddress = headingImageUrl;
      }
    }

    // Increment view count if requested
    if (incrementViewCount) {
      await this.blogRepository.incrementViews(id);
    }

    // Fetch the full content from storage
    const bodyContent = await this.storageService.getBlogContent(blog.bodyKey);

    return {
      ...blog,
      body: bodyContent,
    };
  }

  /**
   * Get blogs filtered by creator with pagination
   */
  async findByCreator(creatorId: string, page = 1, limit = 10) {
    return this.blogRepository.findByCreator(creatorId, page, limit);
  }

  /**
   * Toggle like status for a blog
   */
  async likeBlog(id: string, userId: string) {
    const blog = await this.blogRepository.findOne(id);

    if (!blog) {
      throw new NotFoundException(`Blog with ID ${id} not found`);
    }

    // Check if the user has already liked this blog
    const hasLiked = await this.blogRepository.hasUserLikedBlog(id, userId);

    if (hasLiked) {
      // User already liked the blog, so unlike it
      await this.blogRepository.removeUserLike(id, userId);
      await this.blogRepository.decrementLikes(id);
      return {
        liked: false,
        message: 'Blog unliked successfully',
        likesCount: blog.likes - 1,
      };
    } else {
      // User hasn't liked the blog yet, so like it
      await this.blogRepository.addUserLike(id, userId);
      const updatedBlog = await this.blogRepository.incrementLikes(id);
      return {
        liked: true,
        message: 'Blog liked successfully',
        likesCount: updatedBlog.likes,
      };
    }
  }

  /**
   * Update an existing blog with potential content and image changes
   */
  async update(
    id: string,
    updateBlogDto: UpdateBlogDto,
    userId: string,
    headingImage?: MulterFile,
  ) {
    const blog = await this.blogRepository.findOne(id);

    if (!blog) {
      throw new NotFoundException(`Blog with ID ${id} not found`);
    }

    // Verify ownership
    if (blog.creatorId !== userId) {
      throw new ForbiddenException('You can only update your own blogs');
    }

    const updateData: any = { ...updateBlogDto };
    delete updateData.body; // Remove body from DB update data

    // Handle heading image update if provided
    if (headingImage) {
      // Delete old image if exists
      if (blog.headingImageKey) {
        await this.storageService.deleteFile(blog.headingImageKey, 'media');
      }

      // Upload new image
      const { fileKey } =
        await this.storageService.uploadBlogImage(headingImage);

      // Generate a signed URL for the heading image
      const headingImageUrl = await this.storageService.getSignedUrl(
        fileKey,
        3600 * 24 * BLOG_HEADING_IMG_URL_EXPIRY_DAYS, // 7 days expiration
        false,
        'media',
      );

      updateData.headingImageAddress = headingImageUrl;
      updateData.headingImageKey = fileKey;
    }

    // Handle body content update if provided
    if (updateBlogDto.body) {
      // Update content in storage
      const { publicUrl, fileKey } = blog.bodyKey
        ? await this.storageService.updateBlogContent(
            updateBlogDto.body,
            blog.bodyKey,
          )
        : await this.storageService.uploadBlogContent(updateBlogDto.body);

      updateData.bodyAddress = publicUrl;
      updateData.bodyKey = fileKey;
    }

    return this.blogRepository.update(id, updateData);
  }
  async isAuthorized(blog: Partial<BlogEntity>, userId: string) {
    if (blog.creatorId !== userId) {
      let user = await this.userService.findOne(userId);
      if (user.role !== UserRoleEnum.ADMIN) {
        throw new ForbiddenException(
          'You are not authorized to perform this action',
        );
      }
    }
  }

  /**
   * Delete a blog and its associated files
   */
  async remove(id: string, userId: string) {
    const blog = await this.blogRepository.findOne(id);

    if (!blog) {
      throw new NotFoundException(`Blog with ID ${id} not found`);
    }

    // Verify ownership
    await this.isAuthorized(blog, userId);

    // Delete associated files from storage
    if (blog.headingImageKey) {
      await this.storageService.deleteFile(blog.headingImageKey, 'media');
    }

    if (blog.bodyKey) {
      await this.storageService.deleteFile(blog.bodyKey, 'blogs');
    }

    // Delete the blog from database
    return this.blogRepository.remove(id);
  }

  /**
   * Add a comment to a blog
   */
  async addComment(createCommentDto: CreateCommentDto, userId: string) {
    const blog = await this.blogRepository.findOne(createCommentDto.blogId);

    if (!blog) {
      throw new NotFoundException(
        `Blog with ID ${createCommentDto.blogId} not found`,
      );
    }

    // Set the user ID from authenticated user
    createCommentDto.userId = userId;

    return this.blogRepository.createComment(createCommentDto);
  }

  /**
   * Get paginated comments for a blog
   */
  async getComments(blogId: string, page = 1, limit = 20) {
    const blog = await this.blogRepository.findOne(blogId);

    if (!blog) {
      throw new NotFoundException(`Blog with ID ${blogId} not found`);
    }

    return this.blogRepository.getComments(blogId, page, limit);
  }

  /**
   * Delete a comment (only by the comment author)
   */
  async deleteComment(commentId: string, userId: string) {
    const success = await this.blogRepository.deleteComment(commentId, userId);

    if (!success) {
      throw new NotFoundException(
        `Comment not found or you don't have permission to delete it`,
      );
    }

    return { success: true };
  }

  async review(
    blogId: string,
    reviewData: {
      reviewStatus: ApprovalStatus;
      reviewedById: string;
    },
  ) {
    const blog = await this.blogRepository.findOne(blogId);
    if (!blog) {
      throw new NotFoundException('Blog not found');
    }

    return this.blogRepository.update(blogId, {
      reviewStatus: reviewData.reviewStatus,
      reviewedById: reviewData.reviewedById,
    });
  }
}
