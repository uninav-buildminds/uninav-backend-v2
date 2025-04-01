import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  Query,
  BadRequestException,
  UseGuards,
  Req,
} from '@nestjs/common';
import { MaterialService } from './material.service';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { ResponseDto } from 'src/utils/globalDto/response.dto';
import { ResourceType, UserEntity } from 'src/utils/types/db.types';
import { RolesGuard } from 'src/guards/roles.guard';
import { Request } from 'express';
import { MulterFile } from 'src/utils/types';
import { materialLogger as logger } from 'src/modules/material/material.module';
@Controller('materials')
export class MaterialController {
  constructor(private readonly materialService: MaterialService) {}

  @Post()
  @UseGuards(RolesGuard)
  @UseInterceptors(FileInterceptor('file'))
  async create(
    @Req() req: Request,
    @Body() createMaterialDto: CreateMaterialDto,
    @UploadedFile() file?: MulterFile,
  ) {
    // Extract user from request (from auth guard)
    const user = req['user'] as UserEntity;

    createMaterialDto.creatorId = user.id;

    logger.log({ createMaterialDto });
    // Validate file upload for UPLOADED type
    if (createMaterialDto.resourceType === ResourceType.UPLOADED && !file) {
      throw new BadRequestException(
        'File upload is required for uploaded resources',
      );
    }

    const material = await this.materialService.create(createMaterialDto, file);
    return ResponseDto.createSuccessResponse(
      'Material created successfully',
      material,
    );
  }

  @Get()
  async findAll() {
    const materials = await this.materialService.findAll();
    return ResponseDto.createSuccessResponse(
      'Materials retrieved successfully',
      materials,
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const material = await this.materialService.findOne(id);
    return ResponseDto.createSuccessResponse(
      'Material retrieved successfully',
      material,
    );
  }

  @Get(':id/download')
  async download(
    @Param('id') id: string,
    @Query('forceDownload') forceDownload: boolean,
  ) {
    const result = await this.materialService.getDownloadUrl(id, forceDownload);
    return ResponseDto.createSuccessResponse(
      'Download URL generated successfully',
      result,
    );
  }

  @Post(':id/like')
  async likeMaterial(@Param('id') id: string) {
    const material = await this.materialService.likeMaterial(id);
    return ResponseDto.createSuccessResponse(
      'Material liked successfully',
      material,
    );
  }

  @Get('by-creator/:creatorId')
  async findByCreator(@Param('creatorId') creatorId: string) {
    const materials = await this.materialService.findByCreator(creatorId);
    return ResponseDto.createSuccessResponse(
      'Materials retrieved successfully',
      materials,
    );
  }

  @Get('by-type/:type')
  async findByType(@Param('type') type: string) {
    const materials = await this.materialService.findByType(type);
    return ResponseDto.createSuccessResponse(
      'Materials retrieved successfully',
      materials,
    );
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @UseInterceptors(FileInterceptor('file'))
  async update(
    @Param('id') id: string,
    @Body() updateMaterialDto: UpdateMaterialDto,
    @UploadedFile() file?: MulterFile,
  ) {
    const material = await this.materialService.update(
      id,
      updateMaterialDto,
      file,
    );
    return ResponseDto.createSuccessResponse(
      'Material updated successfully',
      material,
    );
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  async remove(@Param('id') id: string) {
    const material = await this.materialService.remove(id);
    return ResponseDto.createSuccessResponse(
      'Material deleted successfully',
      material,
    );
  }
}
