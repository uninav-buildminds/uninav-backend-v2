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
} from '@nestjs/common';
import { CollectionService } from './collection.service';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { UpdateCollectionDto } from './dto/update-collection.dto';
import { AddMaterialToCollectionDto } from './dto/add-material.dto';
import { ResponseDto } from '@app/common/dto/response.dto';
import { RolesGuard } from '@app/common/guards/roles.guard';
import { Request } from 'express';
import { UserEntity } from '@app/common/types/db.types';
@Controller('collections')
export class CollectionController {
  constructor(private readonly collectionService: CollectionService) {}

  @Post()
  @UseGuards(RolesGuard)
  async create(
    @Body() createCollectionDto: CreateCollectionDto,
    @Req() req: Request,
  ) {
    // Extract user from request (from auth guard)
    const user = req['user'] as UserEntity;

    // Set creatorId if not provided in the DTO
    createCollectionDto.creatorId = user.id;

    const collection = await this.collectionService.create(createCollectionDto);
    return ResponseDto.createSuccessResponse(
      'Collection created successfully',
      collection,
    );
  }

  @Get()
  @UseGuards(RolesGuard)
  async findAll(@Req() req: Request) {
    const user = req['user'] as UserEntity;
    const collections = await this.collectionService.findAll(user.id);
    return ResponseDto.createSuccessResponse(
      'Collections retrieved successfully',
      collections,
    );
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  async findOne(@Param('id') id: string) {
    const collection = await this.collectionService.findOne(id);
    return ResponseDto.createSuccessResponse(
      'Collection retrieved successfully',
      collection,
    );
  }

  @Get('by-creator/:creatorId')
  async findByCreator(@Param('creatorId') creatorId: string) {
    const collections = await this.collectionService.findByCreator(creatorId);
    return ResponseDto.createSuccessResponse(
      'Collections retrieved successfully',
      collections,
    );
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  async update(
    @Param('id') id: string,
    @Body() updateCollectionDto: UpdateCollectionDto,
    @Req() req: Request,
  ) {
    const user = req['user'] as UserEntity;
    const collection = await this.collectionService.update(
      id,
      updateCollectionDto,
      user.id,
    );
    return ResponseDto.createSuccessResponse(
      'Collection updated successfully',
      collection,
    );
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  async remove(@Param('id') id: string, @Req() req: Request) {
    const user = req['user'] as UserEntity;
    const collection = await this.collectionService.remove(id, user.id);
    return ResponseDto.createSuccessResponse(
      'Collection deleted successfully',
      collection,
    );
  }

  // Material management in collections
  @Post(':id/materials')
  @UseGuards(RolesGuard)
  async addMaterial(
    @Param('id') id: string,
    @Body() addMaterialDto: AddMaterialToCollectionDto,
    @Req() req: Request,
  ) {
    const user = req['user'] as UserEntity;
    const result = await this.collectionService.addMaterialToCollection(
      id,
      addMaterialDto,
      user.id,
    );
    return ResponseDto.createSuccessResponse(
      'Material added to collection successfully',
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
    const result = await this.collectionService.removeMaterialFromCollection(
      id,
      materialId,
      user.id,
    );
    return ResponseDto.createSuccessResponse(
      'Material removed from collection successfully',
      result,
    );
  }

  // Nested collection management
  @Post(':id/collections')
  @UseGuards(RolesGuard)
  async addNestedCollection(
    @Param('id') id: string,
    @Body() addCollectionDto: { collectionId: string },
    @Req() req: Request,
  ) {
    const user = req['user'] as UserEntity;
    const result = await this.collectionService.addNestedCollection(
      id,
      addCollectionDto.collectionId,
      user.id,
    );
    return ResponseDto.createSuccessResponse(
      'Collection nested successfully',
      result,
    );
  }

  @Delete(':id/collections/:collectionId')
  @UseGuards(RolesGuard)
  async removeNestedCollection(
    @Param('id') id: string,
    @Param('collectionId') collectionId: string,
    @Req() req: Request,
  ) {
    const user = req['user'] as UserEntity;
    const result = await this.collectionService.removeNestedCollection(
      id,
      collectionId,
      user.id,
    );
    return ResponseDto.createSuccessResponse(
      'Nested collection removed successfully',
      result,
    );
  }
}
