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
  Req,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiQuery,
  ApiParam,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiForbiddenResponse,
  ApiCreatedResponse,
} from '@nestjs/swagger';
import { MaterialService } from './material.service';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { ResponseDto } from 'src/utils/globalDto/response.dto';
import {
  ResourceType,
  UserEntity,
  UserRoleEnum,
} from 'src/utils/types/db.types';
import { RolesGuard } from 'src/guards/roles.guard';
import { Request } from 'express';
import { MulterFile } from 'src/utils/types';
import { materialLogger as logger } from 'src/modules/material/material.module';
import { CacheControlInterceptor } from 'src/interceptors/cache-control.interceptor';
import { CacheControl } from 'src/utils/decorators/cache-control.decorator';
import { MaterialResponseDto } from 'src/utils/swagger/material.dto';
import { PaginatedResponseDto } from 'src/utils/swagger/response.dto';
@ApiTags('Materials')
@Controller('materials')
@UseInterceptors(CacheControlInterceptor)
export class MaterialController {
  constructor(private readonly materialService: MaterialService) {}

  @Post()
  @ApiOperation({
    summary: 'Create new material',
    description:
      'Upload and create a new study material with optional file attachment.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Material data with optional file upload',
    type: CreateMaterialDto,
  })
  @ApiCreatedResponse({
    description: 'Material created successfully',
    type: MaterialResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid input data or file format' })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
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
  @ApiOperation({
    summary: 'Get materials with filters',
    description:
      'Retrieve paginated list of materials with optional filtering.',
  })
  @ApiQuery({
    name: 'creatorId',
    required: false,
    description: 'Filter by creator ID',
  })
  @ApiQuery({
    name: 'courseId',
    required: false,
    description: 'Filter by course ID',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    description: 'Filter by material type',
  })
  @ApiQuery({ name: 'tag', required: false, description: 'Filter by tag' })
  @ApiQuery({ name: 'query', required: false, description: 'Search query' })
  @ApiQuery({
    name: 'advancedSearch',
    required: false,
    description: 'Enable advanced search',
  })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiOkResponse({
    description: 'Materials retrieved successfully',
    type: PaginatedResponseDto,
  })
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
  @ApiOperation({
    summary: 'Search materials',
    description: 'Advanced search for materials with role-based access.',
  })
  @ApiQuery({ name: 'query', required: false, description: 'Search query' })
  @ApiQuery({
    name: 'advancedSearch',
    required: false,
    description: 'Enable advanced search',
  })
  @ApiQuery({
    name: 'creatorId',
    required: false,
    description: 'Filter by creator ID',
  })
  @ApiQuery({
    name: 'courseId',
    required: false,
    description: 'Filter by course ID',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    description: 'Filter by material type',
  })
  @ApiQuery({ name: 'tag', required: false, description: 'Filter by tag' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiOkResponse({
    description: 'Search results retrieved successfully',
    type: PaginatedResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
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
    const user = req.user as UserEntity;
    const materials = await this.materialService.searchMaterials(
      {
        query,
        creatorId,
        courseId,
        type,
        tag,
        advancedSearch: !!advancedSearch,
      },
      user,
      +page,
      user.role === UserRoleEnum.ADMIN,
    );
    return ResponseDto.createSuccessResponse(
      'Materials retrieved successfully',
      materials,
    );
  }

  @Get('recommendations')
  @ApiOperation({
    summary: 'Get material recommendations',
    description:
      'Get personalized material recommendations for authenticated user.',
  })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiOkResponse({
    description: 'Recommendations retrieved successfully',
    type: PaginatedResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
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
  @ApiOperation({
    summary: 'Get material resource',
    description: 'Get material resource details by material ID.',
  })
  @ApiParam({ name: 'materialId', description: 'Material ID' })
  @ApiOkResponse({
    description: 'Resource retrieved successfully',
    type: MaterialResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Material not found' })
  async findMaterialResource(@Param('materialId') id: string) {
    const resource = await this.materialService.findMaterialResource(id);
    return ResponseDto.createSuccessResponse(
      'Resource retrieved successfully',
      resource,
    );
  }

  @Post('downloaded/:id')
  @ApiOperation({
    summary: 'Track material download',
    description: 'Increment download count for a material.',
  })
  @ApiParam({ name: 'id', description: 'Material ID' })
  @ApiOkResponse({ description: 'Download tracked successfully' })
  @ApiNotFoundResponse({ description: 'Material not found' })
  @HttpCode(HttpStatus.OK)
  async trackDownload(@Param('id') id: string) {
    await this.materialService.incrementDownloads(id);
    return ResponseDto.createSuccessResponse('Download tracked successfully');
  }

  @Get('download/:id')
  @ApiOperation({
    summary: 'Get material download URL',
    description: 'Get secure download URL for a material.',
  })
  @ApiParam({ name: 'id', description: 'Material ID' })
  @ApiOkResponse({ description: 'Download URL generated successfully' })
  @ApiNotFoundResponse({ description: 'Material not found' })
  async download(@Param('id') id: string) {
    const url = await this.materialService.getDownloadUrl(id);
    return ResponseDto.createSuccessResponse(
      'Download URL generated successfully',
      { url },
    );
  }

  @Get('user/:creatorId')
  @ApiOperation({
    summary: 'Get materials by creator',
    description: 'Get paginated list of materials created by a specific user.',
  })
  @ApiParam({ name: 'creatorId', description: 'Creator user ID' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiOkResponse({
    description: 'Materials retrieved successfully',
    type: PaginatedResponseDto,
  })
  async findByCreator(
    @Param('creatorId') creatorId: string,
    @Query('page') page: string = '1',
  ) {
    const materials = await this.materialService.findAllPaginated({
      creatorId,
      page: +page,
    });
    return ResponseDto.createSuccessResponse(
      'Materials retrieved successfully',
      materials,
    );
  }

  @Get('me')
  @ApiOperation({
    summary: 'Get my materials',
    description:
      'Get paginated list of materials created by authenticated user.',
  })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({
    name: 'type',
    required: false,
    description: 'Filter by material type',
  })
  @ApiQuery({ name: 'tag', required: false, description: 'Filter by tag' })
  @ApiOkResponse({
    description: 'Materials retrieved successfully',
    type: PaginatedResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  @UseGuards(RolesGuard)
  async findMyMaterials(
    @Req() req: Request,
    @Query('page') page: string = '1',
    @Query('type') type?: string,
    @Query('tag') tag?: string,
  ) {
    const user = req['user'] as UserEntity;
    const materials = await this.materialService.findAllPaginated({
      creatorId: user.id,
      page: +page,
      type,
      tag,
    });
    return ResponseDto.createSuccessResponse(
      'Materials retrieved successfully',
      materials,
    );
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update material',
    description: 'Update an existing material with optional file replacement.',
  })
  @ApiParam({ name: 'id', description: 'Material ID' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Updated material data with optional file upload',
    type: UpdateMaterialDto,
  })
  @ApiOkResponse({
    description: 'Material updated successfully',
    type: MaterialResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data or material not found',
  })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  @ApiForbiddenResponse({
    description: 'Not authorized to update this material',
  })
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
  @ApiOperation({
    summary: 'Delete material',
    description: 'Delete a material (only creator or admin can delete).',
  })
  @ApiParam({ name: 'id', description: 'Material ID' })
  @ApiOkResponse({ description: 'Material deleted successfully' })
  @ApiNotFoundResponse({ description: 'Material not found' })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  @ApiForbiddenResponse({
    description: 'Not authorized to delete this material',
  })
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
  @ApiOperation({
    summary: 'Get material by ID',
    description: 'Get detailed information about a specific material.',
  })
  @ApiParam({ name: 'id', description: 'Material ID' })
  @ApiOkResponse({
    description: 'Material retrieved successfully',
    type: MaterialResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Material not found' })
  async getMaterial(@Param('id') id: string) {
    const material = await this.materialService.getMaterial(id);
    return ResponseDto.createSuccessResponse(
      'Material retrieved successfully',
      material,
    );
  }
}
