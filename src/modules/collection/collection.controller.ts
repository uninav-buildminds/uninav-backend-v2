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
import { ResponseDto } from 'src/utils/globalDto/response.dto';
import { RolesGuard } from 'src/guards/roles.guard';
import { Request } from 'express';

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
    const user = req['user'];

    // Set creatorId if not provided in the DTO
    if (!createCollectionDto.creatorId && user) {
      createCollectionDto.creatorId = user.id;
    }

    const collection = await this.collectionService.create(createCollectionDto);
    return ResponseDto.createSuccessResponse(
      'Collection created successfully',
      collection,
    );
  }

  @Get()
  async findAll() {
    const collections = await this.collectionService.findAll();
    return ResponseDto.createSuccessResponse(
      'Collections retrieved successfully',
      collections,
    );
  }

  @Get(':id')
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
  ) {
    const collection = await this.collectionService.update(
      id,
      updateCollectionDto,
    );
    return ResponseDto.createSuccessResponse(
      'Collection updated successfully',
      collection,
    );
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  async remove(@Param('id') id: string) {
    const collection = await this.collectionService.remove(id);
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
  ) {
    const result = await this.collectionService.addMaterialToCollection(
      id,
      addMaterialDto,
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
  ) {
    const result = await this.collectionService.removeMaterialFromCollection(
      id,
      materialId,
    );
    return ResponseDto.createSuccessResponse(
      'Material removed from collection successfully',
      result,
    );
  }
}
