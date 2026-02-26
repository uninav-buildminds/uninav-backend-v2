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
  async findAll(@Req() req: Request) {
    const user = req['user'] as UserEntity;
    const folders = await this.folderService.findAll(user.id);
    return ResponseDto.createSuccessResponse(
      'Folders retrieved successfully',
      folders,
    );
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

  // NOTE: must be declared before @Get(':id') so NestJS does not swallow 'search' as a slug
  @Get('search')
  async search(
    @Query('query') query: string,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    const limitNum = Math.min(parseInt(limit, 10) || 10, 50);
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);

    const items = await this.folderService.searchFolders(query ?? '', limitNum);
    const total = items.length;

    return ResponseDto.createSuccessResponse('Folders retrieved successfully', {
      items,
      pagination: {
        total,
        page: pageNum,
        pageSize: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
        hasMore: false,
        hasPrev: pageNum > 1,
      },
    });
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
