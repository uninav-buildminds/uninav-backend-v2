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
  BadRequestException,
  UseGuards,
  Req,
  Query,
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
import { CacheControlInterceptor } from 'src/interceptors/cache-control.interceptor';
import { CacheControl } from 'src/utils/decorators/cache-control.decorator';
@Controller('materials')
@UseInterceptors(CacheControlInterceptor)
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
    if (createMaterialDto.resourceType === ResourceType.UPLOAD && !file) {
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

  // async findAll() {
  //   const materials = await this.materialService.findAll();
  //   return ResponseDto.createSuccessResponse(
  //     'Materials retrieved successfully',
  //     materials,
  //   );
  // }

  @Get()
  @CacheControl({ public: true, maxAge: 300 }) // Cache for 5 minutes
  async findWithFilters(
    @Query('creatorId') creatorId?: string,
    @Query('courseId') courseId?: string,
    @Query('type') type?: string,
    @Query('tag') tag?: string,
  ) {
    const materials = await this.materialService.findWithFilters({
      creatorId,
      courseId,
      type,
      tag,
    });
    return ResponseDto.createSuccessResponse(
      'Materials retrieved successfully',
      materials,
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const material = await this.materialService.getMaterial(id);
    return ResponseDto.createSuccessResponse(
      'Material retrieved successfully',
      material,
    );
  }

  @Get('resource/:materialId')
  async findMaterialResource(@Param('materialId') id: string) {
    const resource = await this.materialService.findMaterialResource(id);
    return ResponseDto.createSuccessResponse(
      'Resource retrieved successfully',
      resource,
    );
  }

  @Get('download/:id')
  async download(@Param('id') id: string) {
    const url = await this.materialService.getDownloadUrl(id);
    return ResponseDto.createSuccessResponse(
      'Download URL generated successfully',
      { url },
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
  @CacheControl({ public: true, maxAge: 300 })
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
    @Req() req: Request,
    @Param('id') id: string,
    @Body() updateMaterialDto: UpdateMaterialDto,
    @UploadedFile() file?: MulterFile,
  ) {
    const user = req['user'] as UserEntity;
    const material = await this.materialService.update(
      id,
      updateMaterialDto,
      user.id,
      file,
    );
    return ResponseDto.createSuccessResponse(
      'Material updated successfully',
      material,
    );
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  async remove(@Req() req: Request, @Param('id') id: string) {
    const user = req['user'] as UserEntity;
    const material = await this.materialService.remove(id, user.id);
    return ResponseDto.createSuccessResponse(
      'Material deleted successfully',
      material,
    );
  }
}
