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
  HttpCode,
  HttpStatus,
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

    const material = await this.materialService.create(createMaterialDto, file);
    return ResponseDto.createSuccessResponse(
      'Material created successfully',
      material,
    );
  }

  @Get()
  @CacheControl({ public: true, maxAge: 300 }) // Cache for 5 minutes
  async findWithFilters(
    @Query('creatorId') creatorId?: string,
    @Query('courseId') courseId?: string,
    @Query('type') type?: string,
    @Query('tag') tag?: string,
    @Query('query') query?: string,
    @Query('advancedSearch') advancedSearch?: string,
    @Query('page') page: string = '1',
  ) {
    const materials = await this.materialService.findAllPaginated({
      creatorId,
      courseId,
      type,
      tag,
      query,
      page: +page,
      advancedSearch: !!advancedSearch,
    });
    return ResponseDto.createSuccessResponse(
      'Materials retrieved successfully',
      materials,
    );
  }

  @Get('search')
  @UseGuards(RolesGuard)
  @CacheControl({ public: true, maxAge: 300 }) // Cache for 5 minutes
  async search(
    @Req() req: Request,
    @Query('query') query?: string,
    @Query('advancedSearch') advancedSearch?: string,
    @Query('creatorId') creatorId?: string,
    @Query('courseId') courseId?: string,
    @Query('type') type?: string,
    @Query('tag') tag?: string,
    @Query('page') page: string = '1',
  ) {
    const materials = await this.materialService.searchMaterials(
      {
        query,
        creatorId,
        courseId,
        type,
        tag,
        advancedSearch: !!advancedSearch,
      },
      req.user as UserEntity,
      +page,
    );
    return ResponseDto.createSuccessResponse(
      'Materials retrieved successfully',
      materials,
    );
  }

  @Get('recommendations')
  @UseGuards(RolesGuard)
  @CacheControl({ public: true, maxAge: 300 }) // Cache for 5 minutes
  async getRecommendations(
    @Req() req: Request,
    @Query('page') page: number = 1,
  ) {
    const user = req['user'] as UserEntity;
    const recommendations = await this.materialService.getRecommendations(
      user,
      page,
    );
    return ResponseDto.createSuccessResponse(
      'Recommendations retrieved successfully',
      recommendations,
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

  @Get('user/:creatorId')
  async findByCreator(@Param('creatorId') creatorId: string) {
    const materials = await this.materialService.findByCreator(creatorId);
    return ResponseDto.createSuccessResponse(
      'Materials retrieved successfully',
      materials,
    );
  }

  @Get('me')
  @UseGuards(RolesGuard)
  async findMyMaterials(
    @Req() req: Request,
    @Query('page') page: string = '1',
  ) {
    const user = req['user'] as UserEntity;
    const materials = await this.materialService.findAllPaginated({
      creatorId: user.id,
      page: +page,
    });
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

  @Post('like/:id')
  @UseGuards(RolesGuard)
  @HttpCode(HttpStatus.OK)
  async likeMaterial(@Req() req: Request, @Param('id') id: string) {
    const user = req['user'] as UserEntity;
    const result = await this.materialService.likeMaterial(id, user.id);
    return ResponseDto.createSuccessResponse(result.message, result);
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
