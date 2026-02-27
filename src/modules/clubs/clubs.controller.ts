import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { ClubsService } from './clubs.service';
import { CreateClubDto, UpdateClubDto } from './dto/create-club.dto';
import { GetClubsQueryDto } from './dto/get-clubs-query.dto';
import { FlagClubDto } from './dto/flag-club.dto';
import { ResolveFlagDto } from './dto/resolve-flag.dto';
import { CreateClubRequestDto } from './dto/create-club-request.dto';
import { UpdateClubRequestDto } from './dto/update-club-request.dto';
import { UpdateClubStatusDto } from './dto/update-club-status.dto';
import { ResponseDto } from '@app/common/dto/response.dto';
import { RolesGuard } from '@app/common/guards/roles.guard';
import { Roles } from '@app/common/decorators/roles.decorator';
import { MulterFile } from '@app/common/types';
import {
  ClubFlagStatusEnum,
  ClubRequestStatusEnum,
  UserEntity,
  UserRoleEnum,
} from '@app/common/types/db.types';

@Controller('clubs')
export class ClubsController {
  constructor(private readonly clubsService: ClubsService) {}

  // Club CRUD

  @Post()
  @UseGuards(RolesGuard)
  @UseInterceptors(FileInterceptor('image'))
  async create(
    @Body() createClubDto: CreateClubDto,
    @UploadedFile() image: MulterFile,
    @Req() req: Request,
  ) {
    const user = req.user as UserEntity;
    createClubDto.organizerId = user.id;

    const club = await this.clubsService.create(createClubDto, image);
    return ResponseDto.createSuccessResponse(
      'Club created successfully',
      club,
    );
  }

  @Get()
  async findAll(@Query() query: GetClubsQueryDto) {
    const result = await this.clubsService.findAll(query);
    return ResponseDto.createSuccessResponse(
      'Clubs retrieved successfully',
      result,
    );
  }

  @Get('me')
  @UseGuards(RolesGuard)
  async findMyClubs(@Query() query: GetClubsQueryDto, @Req() req: Request) {
    const user = req.user as UserEntity;
    query.organizerId = user.id;

    const result = await this.clubsService.findAll(query);
    return ResponseDto.createSuccessResponse(
      'Your clubs retrieved successfully',
      result,
    );
  }

  @Get('slug/:slug')
  @UseGuards(RolesGuard)
  @Roles([], { strict: false })
  async findBySlug(
    @Param('slug') slug: string,
    @Req() req: Request,
  ) {
    const user = req.user as UserEntity | undefined;
    const viewerId = user?.id ?? null;
    const club = await this.clubsService.findBySlug(slug, viewerId);
    return ResponseDto.createSuccessResponse(
      'Club retrieved successfully',
      club,
    );
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles([], { strict: false })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request,
  ) {
    const user = req.user as UserEntity | undefined;
    // Pass user ID if authenticated, null if anonymous — both trigger view recording.
    // undefined is reserved for internal service calls that should not record views.
    const viewerId = user?.id ?? null;
    const club = await this.clubsService.findOne(id, viewerId);
    return ResponseDto.createSuccessResponse(
      'Club retrieved successfully',
      club,
    );
  }

  @Get(':id/analytics')
  @UseGuards(RolesGuard)
  async getAnalytics(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request,
  ) {
    const user = req.user as UserEntity;
    const analytics = await this.clubsService.getAnalytics(
      id,
      user.id,
      user.role as UserRoleEnum,
    );
    return ResponseDto.createSuccessResponse(
      'Analytics retrieved successfully',
      analytics,
    );
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @UseInterceptors(FileInterceptor('image'))
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateClubDto: UpdateClubDto,
    @UploadedFile() image: MulterFile,
    @Req() req: Request,
  ) {
    const user = req.user as UserEntity;
    const club = await this.clubsService.update(
      id,
      updateClubDto,
      user.id,
      user.role as UserRoleEnum,
      image,
    );
    return ResponseDto.createSuccessResponse(
      'Club updated successfully',
      club,
    );
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request,
  ) {
    const user = req.user as UserEntity;
    const club = await this.clubsService.remove(
      id,
      user.id,
      user.role as UserRoleEnum,
    );
    return ResponseDto.createSuccessResponse(
      'Club deleted successfully',
      club,
    );
  }

  // Click Tracking

  @Post(':id/click')
  @UseGuards(RolesGuard)
  async trackClick(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request,
  ) {
    const user = req.user as UserEntity;
    const result = await this.clubsService.trackClick(id, user);
    return ResponseDto.createSuccessResponse(
      'Click tracked successfully',
      result,
    );
  }

  // Club Status (Admin/Moderator)

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles([UserRoleEnum.ADMIN, UserRoleEnum.MODERATOR])
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateStatusDto: UpdateClubStatusDto,
  ) {
    const club = await this.clubsService.updateStatus(id, updateStatusDto);
    return ResponseDto.createSuccessResponse(
      'Club status updated successfully',
      club,
    );
  }

  // Flagging

  @Post(':id/flag')
  @UseGuards(RolesGuard)
  async flagClub(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() flagClubDto: FlagClubDto,
    @Req() req: Request,
  ) {
    const user = req.user as UserEntity;
    flagClubDto.reporterId = user.id;
    flagClubDto.clubId = id;

    const flag = await this.clubsService.flagClub(flagClubDto);
    return ResponseDto.createSuccessResponse(
      'Club flagged successfully',
      flag,
    );
  }

  @Get('flags/list')
  @UseGuards(RolesGuard)
  @Roles([UserRoleEnum.ADMIN, UserRoleEnum.MODERATOR])
  async getFlags(
    @Query('status') status?: ClubFlagStatusEnum,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const result = await this.clubsService.getFlags({ status, page, limit });
    return ResponseDto.createSuccessResponse(
      'Flags retrieved successfully',
      result,
    );
  }

  @Patch('flags/:flagId/resolve')
  @UseGuards(RolesGuard)
  @Roles([UserRoleEnum.ADMIN, UserRoleEnum.MODERATOR])
  async resolveFlag(
    @Param('flagId', ParseUUIDPipe) flagId: string,
    @Body() resolveFlagDto: ResolveFlagDto,
  ) {
    const flag = await this.clubsService.resolveFlag(flagId, resolveFlagDto);
    return ResponseDto.createSuccessResponse(
      'Flag resolved successfully',
      flag,
    );
  }

  // Club Requests

  @Post('requests')
  @UseGuards(RolesGuard)
  async createRequest(
    @Body() createRequestDto: CreateClubRequestDto,
    @Req() req: Request,
  ) {
    const user = req.user as UserEntity;
    createRequestDto.requesterId = user.id;

    const request = await this.clubsService.createRequest(createRequestDto);
    return ResponseDto.createSuccessResponse(
      'Club request created successfully',
      request,
    );
  }

  @Get('requests/list')
  @UseGuards(RolesGuard)
  @Roles([UserRoleEnum.ADMIN, UserRoleEnum.MODERATOR])
  async getRequests(
    @Query('status') status?: ClubRequestStatusEnum,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const result = await this.clubsService.getRequests({
      status,
      page,
      limit,
    });
    return ResponseDto.createSuccessResponse(
      'Club requests retrieved successfully',
      result,
    );
  }

  @Patch('requests/:requestId')
  @UseGuards(RolesGuard)
  @Roles([UserRoleEnum.ADMIN, UserRoleEnum.MODERATOR])
  async updateRequest(
    @Param('requestId', ParseUUIDPipe) requestId: string,
    @Body() updateRequestDto: UpdateClubRequestDto,
  ) {
    const request = await this.clubsService.updateRequest(
      requestId,
      updateRequestDto,
    );
    return ResponseDto.createSuccessResponse(
      'Club request updated successfully',
      request,
    );
  }
}
