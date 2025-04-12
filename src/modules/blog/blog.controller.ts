import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  UseInterceptors,
  UploadedFile,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { BlogService } from './blog.service';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';
import {
  ApprovalStatus,
  BlogTypeEnum,
  UserEntity,
} from 'src/utils/types/db.types';
import { CreateCommentDto } from './dto/create-comment.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { CacheControl } from 'src/utils/decorators/cache-control.decorator';
import { Request } from 'express';
import { RolesGuard } from 'src/guards/roles.guard';
import { MulterFile } from 'src/utils/types';
import { ResponseDto } from 'src/utils/globalDto/response.dto';

@Controller('blogs')
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  @Post()
  @UseGuards(RolesGuard)
  @UseInterceptors(FileInterceptor('headingImage'))
  async create(
    @Body() createBlogDto: CreateBlogDto,
    @Req() req: Request,
    @UploadedFile() headingImage: any,
  ) {
    const user = req.user as UserEntity;
    createBlogDto.creatorId = user.id;
    const data = await this.blogService.create(
      createBlogDto,
      user,
      headingImage,
    );
    return ResponseDto.createSuccessResponse('Blog created successfully', data);
  }

  @Get()
  @CacheControl({ maxAge: 300, public: true })
  async findAll(
    @Query('query') query?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('type') type?: BlogTypeEnum,
    @Query('reviewStatus') reviewStatus?: ApprovalStatus,
  ) {
    const data = await this.blogService.findAllPaginated({
      query,
      page,
      limit,
      type,
      reviewStatus,
    });
    return ResponseDto.createSuccessResponse(
      'Blogs retrieved successfully',
      data,
    );
  }

  @Get('user/:creatorId')
  @CacheControl({ maxAge: 300, public: true })
  async findByCreator(
    @Param('creatorId', ParseUUIDPipe) creatorId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const data = await this.blogService.findByCreator(creatorId, page, limit);
    return ResponseDto.createSuccessResponse(
      'Creator blogs retrieved successfully',
      data,
    );
  }

  @Get('me')
  @UseGuards(RolesGuard)
  async findMyBlogs(
    @Req() req: Request,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const user = req.user as UserEntity;
    const data = await this.blogService.findByCreator(user.id, page, limit);
    return ResponseDto.createSuccessResponse(
      'Your blogs retrieved successfully',
      data,
    );
  }

  @Get(':id')
  @CacheControl({ maxAge: 3600, public: true })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.blogService.findOne(id);
    return ResponseDto.createSuccessResponse(
      'Blog retrieved successfully',
      data,
    );
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @UseInterceptors(FileInterceptor('headingImage'))
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateBlogDto: UpdateBlogDto,
    @Req() req: Request,
    @UploadedFile() headingImage?: MulterFile,
  ) {
    const user = req.user as UserEntity;
    const data = await this.blogService.update(
      id,
      updateBlogDto,
      user.id,
      headingImage,
    );
    return ResponseDto.createSuccessResponse('Blog updated successfully', data);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id', ParseUUIDPipe) id: string, @Req() req: Request) {
    const user = req.user as UserEntity;
    await this.blogService.remove(id, user.id);
    return ResponseDto.createSuccessResponse('Blog deleted successfully');
  }

  @Post('like/:id')
  @UseGuards(RolesGuard)
  @HttpCode(HttpStatus.OK)
  async likeBlog(@Param('id', ParseUUIDPipe) id: string, @Req() req: Request) {
    const user = req.user as UserEntity;
    const data = await this.blogService.likeBlog(id, user.id);
    return ResponseDto.createSuccessResponse('Blog liked successfully', data);
  }

  @Post(':id/comments')
  @UseGuards(RolesGuard)
  @HttpCode(HttpStatus.CREATED)
  async addComment(
    @Body() createCommentDto: CreateCommentDto,
    @Req() req: Request,
  ) {
    const user = req.user as UserEntity;
    const data = await this.blogService.addComment(createCommentDto, user.id);
    return ResponseDto.createSuccessResponse(
      'Comment added successfully',
      data,
    );
  }

  @Get(':id/comments')
  @CacheControl({ maxAge: 300, public: true })
  async getComments(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const data = await this.blogService.getComments(id, page, limit);
    return ResponseDto.createSuccessResponse(
      'Comments retrieved successfully',
      data,
    );
  }

  @Delete('comments/:commentId')
  @UseGuards(RolesGuard)
  @HttpCode(HttpStatus.OK)
  async deleteComment(
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @Req() req: Request,
  ) {
    const user = req.user as UserEntity;
    await this.blogService.deleteComment(commentId, user.id);
    return ResponseDto.createSuccessResponse(
      'Comment deleted successfully',
      null,
    );
  }
}
