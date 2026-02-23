import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { FolderService } from './folder.service';
import { CreateFolderDto } from './dto/create-folder.dto';
import { UpdateFolderDto } from './dto/update-folder.dto';
import { AddMaterialToFolderDto } from './dto/add-material.dto';
import { ResponseDto } from '@app/common/dto/response.dto';
import { RolesGuard } from '@app/common/guards/roles.guard';
import { Roles } from '@app/common/decorators/roles.decorator';
import { Request } from 'express';
import { UserEntity } from '@app/common/types/db.types';
@Controller('folders')
export class FolderController {
  constructor(private readonly folderService: FolderService) {}

  @Post()
  @UseGuards(RolesGuard)
  async create(@Body() createFolderDto: CreateFolderDto, @Req() req: Request) {
    // Extract user from request (from auth guard)
    const user = req['user'] as UserEntity;

    // Set creatorId if not provided in the DTO
    createFolderDto.creatorId = user.id;

    const folder = await this.folderService.create(createFolderDto);
    return ResponseDto.createSuccessResponse(
      'Folder created successfully',
      folder,
    );
  }

  @Get()
  @UseGuards(RolesGuard)
  async findAll(
    @Req() req: Request,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const user = req['user'] as UserEntity;

    // Support pagination when query params are provided
    if (page !== undefined || limit !== undefined) {
      const pageNum = Math.max(1, Number.parseInt(page || '1', 10) || 1);
      const limitNum = Math.min(
        50,
        Math.max(1, Number.parseInt(limit || '10', 10) || 10),
      );

      const result = await this.folderService.findAllPaginated(
        user.id,
        pageNum,
        limitNum,
      );

      return ResponseDto.createSuccessResponse(
        'Folders retrieved successfully',
        result,
      );
    }

    // Legacy: return full list when pagination params are absent
    const folders = await this.folderService.findAll(user.id);
    return ResponseDto.createSuccessResponse(
      'Folders retrieved successfully',
      folders,
    );
  }

  @Get('material-ids')
  @UseGuards(RolesGuard)
  async getMaterialIdsInFolders(@Req() req: Request) {
    const user = req['user'] as UserEntity;
    const materialIds = await this.folderService.getMaterialIdsInUserFolders(
      user.id,
    );
    return ResponseDto.createSuccessResponse(
      'Material IDs in folders retrieved successfully',
      { materialIds },
    );
  }

  @Get('search')
  @UseGuards(RolesGuard)
  @Roles([], { strict: false }) // Allow guest access for public folders
  async searchFolders(
    @Query('query') query: string,
    @Query('limit') limit: number = 10,
    @Query('page') page: number = 1,
  ) {
    if (!query || query.trim().length < 3) {
      return ResponseDto.createSuccessResponse(
        'Folders searched successfully',
        {
          items: [],
          pagination: {
            total: 0,
            page: 1,
            pageSize: limit,
            totalPages: 0,
            hasMore: false,
            hasPrev: false,
          },
        },
      );
    }

    const offset = (page - 1) * limit;
    const results = await this.folderService.searchFolders(
      query.trim(),
      limit + 1, // Get one extra to check if there are more
      offset,
    );

    const hasMore = results.length > limit;
    const items = hasMore ? results.slice(0, limit) : results;
    const total = hasMore ? offset + results.length : offset + items.length;

    return ResponseDto.createSuccessResponse('Folders searched successfully', {
      items,
      pagination: {
        total,
        page,
        pageSize: limit,
        totalPages: hasMore ? page + 1 : page, // Approximate total pages
        hasMore,
        hasPrev: page > 1,
      },
    });
  }

  @Get('stats/:id')
  @UseGuards(RolesGuard)
  @Roles([], { strict: false }) // Allow guest access for public folders
  async getStats(@Param('id') id: string) {
    const stats = await this.folderService.getFolderStats(id);
    return ResponseDto.createSuccessResponse(
      'Folder stats retrieved successfully',
      stats,
    );
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles([], { strict: false }) // Allow guest access for public folders
  async findOne(@Param('id') id: string, @Req() req: Request) {
    const user = req['user'] as UserEntity | undefined;
    const folder = await this.folderService.getFolder(id, user?.id);
    return ResponseDto.createSuccessResponse(
      'Folder retrieved successfully',
      folder,
    );
  }

  @Get('by-creator/:creatorId')
  async findByCreator(@Param('creatorId') creatorId: string) {
    const folders = await this.folderService.findByCreator(creatorId);
    return ResponseDto.createSuccessResponse(
      'Folders retrieved successfully',
      folders,
    );
  }

  @Get('by-material/:materialId')
  async findByMaterial(@Param('materialId') materialId: string) {
    const folders = await this.folderService.getFoldersByMaterial(materialId);
    return ResponseDto.createSuccessResponse(
      'Folders containing material retrieved successfully',
      folders,
    );
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  async update(
    @Param('id') id: string,
    @Body() updateFolderDto: UpdateFolderDto,
    @Req() req: Request,
  ) {
    const user = req['user'] as UserEntity;
    const folder = await this.folderService.update(
      id,
      updateFolderDto,
      user.id,
    );
    return ResponseDto.createSuccessResponse(
      'Folder updated successfully',
      folder,
    );
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  async remove(@Param('id') id: string, @Req() req: Request) {
    const user = req['user'] as UserEntity;
    const folder = await this.folderService.remove(id, user.id);
    return ResponseDto.createSuccessResponse(
      'Folder deleted successfully',
      folder,
    );
  }

  // Material management in folders
  @Post(':id/materials')
  @UseGuards(RolesGuard)
  async addMaterial(
    @Param('id') id: string,
    @Body() addMaterialDto: AddMaterialToFolderDto,
    @Req() req: Request,
  ) {
    const user = req['user'] as UserEntity;
    const result = await this.folderService.addMaterialToFolder(
      id,
      addMaterialDto,
      user.id,
    );
    return ResponseDto.createSuccessResponse(
      'Material added to folder successfully',
      result,
    );
  }

  @Delete(':id/materials/:materialId')
  @UseGuards(RolesGuard)
  async removeMaterial(
    @Param('id') id: string,
    @Param('materialId') materialId: string,
    @Req() req: Request,
  ) {
    const user = req['user'] as UserEntity;
    const result = await this.folderService.removeMaterialFromFolder(
      id,
      materialId,
      user.id,
    );
    return ResponseDto.createSuccessResponse(
      'Material removed from folder successfully',
      result,
    );
  }

  // Nested folder management
  @Post(':id/folders')
  @UseGuards(RolesGuard)
  async addNestedFolder(
    @Param('id') id: string,
    @Body() addFolderDto: { folderId: string },
    @Req() req: Request,
  ) {
    const user = req['user'] as UserEntity;
    const result = await this.folderService.addNestedFolder(
      id,
      addFolderDto.folderId,
      user.id,
    );
    return ResponseDto.createSuccessResponse(
      'Folder nested successfully',
      result,
    );
  }

  @Delete(':id/folders/:folderId')
  @UseGuards(RolesGuard)
  async removeNestedFolder(
    @Param('id') id: string,
    @Param('folderId') folderId: string,
    @Req() req: Request,
  ) {
    const user = req['user'] as UserEntity;
    const result = await this.folderService.removeNestedFolder(
      id,
      folderId,
      user.id,
    );
    return ResponseDto.createSuccessResponse(
      'Nested folder removed successfully',
      result,
    );
  }
}
