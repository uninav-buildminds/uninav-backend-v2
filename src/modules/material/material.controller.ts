// trigger
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
  UseGuards,
  Query,
  HttpCode,
  HttpStatus,
  BadRequestException,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { MaterialService } from 'src/modules/material/services/material.service';
import { CreateMaterialDto } from 'src/modules/material/dto/create-material.dto';
import { UpdateMaterialDto } from 'src/modules/material/dto/update-material.dto';
import { MaterialQueryDto } from 'src/modules/material/dto/material-query.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { ResponseDto } from '@app/common/dto/response.dto';
import {
  MaterialTypeEnum,
  UserEntity,
  UserRoleEnum,
} from '@app/common/types/db.types';
import { RolesGuard } from '@app/common/guards/roles.guard';
import { Roles } from '@app/common/decorators/roles.decorator';
import { CurrentUser } from '@app/common/decorators/current-user.decorator';
import { MulterFile } from '@app/common/types';
import { materialLogger as logger } from 'src/modules/material/material.module';
import { CacheControlInterceptor } from '@app/common/interceptors/cache-control.interceptor';
import { CacheControl } from '@app/common/decorators/cache-control.decorator';
import { PreviewService } from './services/preview.service';
import { BatchFindMaterialsDto } from './dto/batch-find-materials.dto';
@Controller('materials')
@UseInterceptors(CacheControlInterceptor)
export class MaterialController {
  constructor(
    private readonly materialService: MaterialService,
    private readonly previewService: PreviewService,
  ) {}

  @Post()
  @UseGuards(RolesGuard)
  @UseInterceptors(FileInterceptor('file'))
  async create(
    @UploadedFile() file: MulterFile,
    @CurrentUser() user: UserEntity,
    @Body() createMaterialDto: CreateMaterialDto,
  ) {
    createMaterialDto.creatorId = user.id;

    // Enhanced logging for debugging
    logger.debug('File upload attempt:', {
      hasFile: !!file,
      fileName: file?.originalname,
      fileSize: file?.size,
      mimeType: file?.mimetype,
      fieldName: file?.fieldname,
      dto: createMaterialDto,
    });

    const material = await this.materialService.create(createMaterialDto, file);
    return ResponseDto.createSuccessResponse(
      'Material created successfully',
      material,
    );
  }

  @Get()
  @CacheControl({ public: true, maxAge: 300 }) // Cache for 5 minutes
  async findWithFilters(@Query() queryDto: MaterialQueryDto) {
    const result = await this.materialService.searchMaterial(queryDto);
    return ResponseDto.createPaginatedResponse(
      'Materials retrieved successfully',
      result.items,
      result.pagination,
    );
  }

  @Get('recommendations')
  @UseGuards(RolesGuard)
  @CacheControl({ public: true, maxAge: 300 }) // Cache for 5 minutes
  async getRecommendations(
    @CurrentUser() user: UserEntity,
    @Query('page') page: number = 1,
  ) {
    const result = await this.materialService.getRecommendations(user, page);
    return ResponseDto.createPaginatedResponse(
      'Recommendations retrieved successfully',
      result.items,
      result.pagination,
    );
  }

  @Get('recent')
  @UseGuards(RolesGuard)
  @Roles() // Requires authentication (strict mode by default)
  @CacheControl({ public: false, maxAge: 0 }) // No cache - user-specific and changes frequently
  async getRecentMaterials(
    @CurrentUser() user: UserEntity,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    const result = await this.materialService.getRecentMaterials(
      user,
      page,
      limit,
    );
    return ResponseDto.createPaginatedResponse(
      'Recent materials retrieved successfully',
      result.items,
      result.pagination,
    );
  }

  @Get('popular')
  @CacheControl({ public: true, maxAge: 300 })
  async getPopularMaterials() {
    const items = await this.materialService.getPopularMaterials(10);
    return ResponseDto.createSuccessResponse(
      'Popular materials retrieved successfully',
      items,
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

  @Patch(':id')
  @UseGuards(RolesGuard)
  @UseInterceptors(FileInterceptor('file'))
  async update(
    @CurrentUser() user: UserEntity,
    @Param('id') id: string,
    @Body() updateMaterialDto: UpdateMaterialDto,
    @UploadedFile() file?: MulterFile,
  ) {
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
  async remove(@CurrentUser() user: UserEntity, @Param('id') id: string) {
    const material = await this.materialService.remove(id, user.id);
    return ResponseDto.createSuccessResponse(
      'Material deleted successfully',
      material,
    );
  }

  @Post('like/:id')
  @UseGuards(RolesGuard)
  @HttpCode(HttpStatus.OK)
  async likeMaterial(@CurrentUser() user: UserEntity, @Param('id') id: string) {
    const result = await this.materialService.likeMaterial(id, user.id);
    return ResponseDto.createSuccessResponse(result.message, result);
  }
  @Post('preview/upload/temp')
  @UseGuards(RolesGuard)
  @UseInterceptors(FileInterceptor('preview'))
  async uploadTempPreview(@UploadedFile() file: MulterFile): Promise<any> {
    if (!file) {
      throw new BadRequestException('Preview file is required');
    }

    // Validate that it's an image
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Preview file must be an image');
    }

    // Upload the preview image to Cloudinary
    const uploadResult = await this.previewService.uploadPreviewImage(file);

    return ResponseDto.createSuccessResponse('Preview uploaded successfully', {
      previewUrl: uploadResult,
    });
  }

  @Delete('preview/cleanup/temp')
  @UseGuards(RolesGuard)
  async cleanupTempPreview(@Body() body: { previewUrl: string }): Promise<any> {
    if (!body.previewUrl) {
      throw new BadRequestException('Preview URL is required');
    }

    try {
      // Extract file key from Cloudinary URL and delete it
      const deleted = await this.previewService.deleteTempPreview(
        body.previewUrl,
      );

      return ResponseDto.createSuccessResponse(
        'Temp preview cleaned up successfully',
        {
          deleted,
        },
      );
    } catch (error) {
      // Don't throw error if cleanup fails - just log it
      console.warn('Failed to cleanup temp preview:', error);
      return ResponseDto.createSuccessResponse('Cleanup attempted', {
        deleted: false,
      });
    }
  }

  @Post('preview/upload/:materialId')
  @UseGuards(RolesGuard)
  @UseInterceptors(FileInterceptor('preview'))
  async uploadPreview(
    @UploadedFile() file: MulterFile,
    @Param('materialId') materialId: string,
  ): Promise<any> {
    if (!file) {
      throw new BadRequestException('Preview file is required');
    }

    // Validate that it's an image
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Preview file must be an image');
    }

    // Upload the preview image
    const uploadResult = await this.previewService.uploadPreviewImage(file);

    const result = await this.materialService.updateMaterialPreview(
      materialId,
      uploadResult,
    );
    return ResponseDto.createSuccessResponse('Preview uploaded successfully', {
      previewUrl: uploadResult,
    });
  }

  // Removed: GDrive preview generation endpoint; previews are now handled on the frontend.

  @Get('batch')
  @UseGuards(RolesGuard)
  @Roles([], { strict: false }) // Optional authentication - accessible to both guests and signed-in users
  @CacheControl({ public: true, maxAge: 300 }) // Cache for 5 minutes
  async findMaterialsBatch(
    @Query() batchFindDto: BatchFindMaterialsDto,
    @CurrentUser() user?: UserEntity,
  ) {
    const materials = await this.materialService.findManyByIds(
      batchFindDto.materialIds,
      user?.id,
    );

    return ResponseDto.createSuccessResponse(
      `${materials.length} materials retrieved successfully`,
      {
        materials,
        found: materials.length,
        requested: batchFindDto.materialIds.length,
      },
    );
  }

  @Post(':id/download')
  @UseGuards(RolesGuard)
  @HttpCode(HttpStatus.OK)
  async trackDownload(
    @Param('id') id: string,
    @CurrentUser() user: UserEntity,
  ) {
    await this.materialService.trackDownload(id, user.id);
    return ResponseDto.createSuccessResponse(
      'Download tracked successfully',
      null,
    );
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles([], { strict: false }) // Optional authentication - accessible to both guests and signed-in users
  async getMaterial(@Param('id') id: string, @CurrentUser() user?: UserEntity) {
    const material = await this.materialService.getMaterial(id, user?.id);
    return ResponseDto.createSuccessResponse(
      'Material retrieved successfully',
      material,
    );
  }
}
