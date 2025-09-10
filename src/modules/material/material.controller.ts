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
import { CurrentUser } from '@app/common/decorators/current-user.decorator';
import { MulterFile } from '@app/common/types';
import { materialLogger as logger } from 'src/modules/material/material.module';
import { CacheControlInterceptor } from '@app/common/interceptors/cache-control.interceptor';
import { CacheControl } from '@app/common/decorators/cache-control.decorator';
import { ProcessGDriveUrlDto, PreviewResult } from './dto/preview.dto';
import { PreviewService } from './services/preview.service';
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

  @Get('resource/:materialId')
  async findMaterialResource(@Param('materialId') id: string) {
    const resource = await this.materialService.findMaterialResource(id);
    return ResponseDto.createSuccessResponse(
      'Resource retrieved successfully',
      resource,
    );
  }

  @Post('downloaded/:id')
  @HttpCode(HttpStatus.OK)
  async trackDownload(@Param('id') id: string) {
    await this.materialService.incrementDownloads(id);
    return ResponseDto.createSuccessResponse('Download tracked successfully');
  }

  @Get('download/:id')
  async download(@Param('id') id: string) {
    const url = await this.materialService.getDownloadUrl(id);
    return ResponseDto.createSuccessResponse(
      'Download URL generated successfully',
      { url },
    );
  }

  // @Get('me')
  // @UseGuards(RolesGuard)
  // async findMyMaterials(
  //   @CurrentUser() user: UserEntity,
  //   @Query() queryDto: Omit<MaterialQueryDto, 'creatorId'>,
  // ) {
  //   const result = await this.materialService.searchMaterial({
  //     ...queryDto,
  //     creatorId: user.id,
  //   });
  //   return ResponseDto.createPaginatedResponse(
  //     'Materials retrieved successfully',
  //     result.items,
  //     result.pagination,
  //   );
  // }

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

  @Post('test/gdrive/preview')
  @UseGuards(RolesGuard)
  async generateGDrivePreview(
    @Body() processGDriveDto: ProcessGDriveUrlDto,
  ): Promise<any> {
    const result = await this.previewService.processGDriveUrl(
      processGDriveDto.url,
    );
    return ResponseDto.createSuccessResponse(
      'Google Drive preview generated successfully',
      result,
    );
  }

  @Get(':id')
  async getMaterial(@Param('id') id: string) {
    const material = await this.materialService.getMaterial(id);
    return ResponseDto.createSuccessResponse(
      'Material retrieved successfully',
      material,
    );
  }
}
