import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { AdvertService } from './advert.service';
import { CreateFreeAdvertDto } from './dto/create-advert.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { ResponseDto } from 'src/utils/globalDto/response.dto';
import { RolesGuard } from 'src/guards/roles.guard';
import { MulterFile } from 'src/utils/types';

@Controller('adverts')
export class AdvertController {
  constructor(private readonly advertService: AdvertService) {}

  @Post()
  @UseGuards(RolesGuard)
  @UseInterceptors(FileInterceptor('image'))
  async create(
    @Body() createAdvertDto: CreateFreeAdvertDto,
    @UploadedFile() image: MulterFile,
  ) {
    if (!image) {
      throw new BadRequestException('Advertisement image is required');
    }

    const advert = await this.advertService.create(createAdvertDto, image);
    return ResponseDto.createSuccessResponse(
      'Advertisement created successfully',
      advert,
    );
  }

  @Get()
  async findAll() {
    const adverts = await this.advertService.findAll();
    return ResponseDto.createSuccessResponse(
      'Advertisements retrieved successfully',
      adverts,
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const advert = await this.advertService.findOne(id);
    await this.advertService.trackView(id);
    return ResponseDto.createSuccessResponse(
      'Advertisement retrieved successfully',
      advert,
    );
  }

  @Get('material/:materialId')
  async findByMaterial(@Param('materialId') materialId: string) {
    const adverts = await this.advertService.findByMaterial(materialId);
    return ResponseDto.createSuccessResponse(
      'Advertisements retrieved successfully',
      adverts,
    );
  }

  @Get('collection/:collectionId')
  async findByCollection(@Param('collectionId') collectionId: string) {
    const adverts = await this.advertService.findByCollection(collectionId);
    return ResponseDto.createSuccessResponse(
      'Advertisements retrieved successfully',
      adverts,
    );
  }

  @Post(':id/click')
  async trackClick(@Param('id') id: string) {
    await this.advertService.trackClick(id);
    return ResponseDto.createSuccessResponse('Click tracked successfully');
  }
}
