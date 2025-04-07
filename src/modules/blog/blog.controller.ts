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
import { UserEntity } from 'src/utils/types/db.types';
import { CreateCommentDto } from './dto/create-comment.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { CacheControl } from 'src/utils/decorators/cache-control.decorator';
import { Request } from 'express';
import { RolesGuard } from 'src/guards/roles.guard';
import { MulterFile } from 'src/utils/types';

@Controller('blogs')
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  @Post()
  @UseGuards(RolesGuard)
  @UseInterceptors(FileInterceptor('headingImage'))
  create(
    @Body() createBlogDto: CreateBlogDto,
    @Req() req: Request,
    @UploadedFile() headingImage: any,
  ) {
    const user = req.user as UserEntity;
    return this.blogService.create(createBlogDto, user, headingImage);
  }

  @Get()
  @CacheControl({ maxAge: 300, public: true }) // Cache for 5 minutes
  findAll(
    @Query('query') query?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('type') type?: string,
  ) {
    return this.blogService.findAll(query, page, limit, type);
  }

  @Get('user/:creatorId')
  @CacheControl({ maxAge: 300, public: true }) // Cache for 5 minutes
  findByCreator(
    @Param('creatorId', ParseUUIDPipe) creatorId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.blogService.findByCreator(creatorId, page, limit);
  }

  @Get('me')
  @UseGuards(RolesGuard)
  @CacheControl({ maxAge: 120, private: true }) // Cache for 2 minutes
  findMyBlogs(
    @Req() req: Request,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const user = req.user as UserEntity;
    return this.blogService.findByCreator(user.id, page, limit);
  }

  @Get(':id')
  @CacheControl({ maxAge: 3600, public: true }) // Cache for 1 hour
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.blogService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @UseInterceptors(FileInterceptor('headingImage'))
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateBlogDto: UpdateBlogDto,
    @Req() req: Request,
    @UploadedFile() headingImage?: MulterFile,
  ) {
    const user = req.user as UserEntity;
    return this.blogService.update(id, updateBlogDto, user.id, headingImage);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string, @Req() req: Request) {
    const user = req.user as UserEntity;
    return this.blogService.remove(id, user.id);
  }

  @Post(':id/like')
  @UseGuards(RolesGuard)
  @HttpCode(HttpStatus.OK)
  likeBlog(@Param('id', ParseUUIDPipe) id: string, @Req() req: Request) {
    const user = req.user as UserEntity;
    return this.blogService.likeBlog(id, user.id);
  }

  @Post(':id/click')
  @HttpCode(HttpStatus.OK)
  trackClick(@Param('id', ParseUUIDPipe) id: string) {
    return this.blogService.trackClick(id);
  }

  @Post(':id/comments')
  @UseGuards(RolesGuard)
  @HttpCode(HttpStatus.CREATED)
  addComment(@Body() createCommentDto: CreateCommentDto, @Req() req: Request) {
    const user = req.user as UserEntity;
    return this.blogService.addComment(createCommentDto, user.id);
  }

  @Get(':id/comments')
  @CacheControl({ maxAge: 300, public: true }) // Cache for 5 minutes
  getComments(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.blogService.getComments(id, page, limit);
  }

  @Delete('comments/:commentId')
  @UseGuards(RolesGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteComment(
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @Req() req: Request,
  ) {
    const user = req.user as UserEntity;
    return this.blogService.deleteComment(commentId, user.id);
  }
}
