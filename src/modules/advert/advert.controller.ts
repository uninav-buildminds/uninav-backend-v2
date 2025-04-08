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
  Req,
  Patch,
  Delete,
} from '@nestjs/common';
import { AdvertService } from './advert.service';
import { CreateFreeAdvertDto, UpdateAdvertDto } from './dto/create-advert.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { ResponseDto } from 'src/utils/globalDto/response.dto';
import { RolesGuard } from 'src/guards/roles.guard';
import { MulterFile } from 'src/utils/types';
import { Request } from 'express';
import { AdvertTypeEnum, UserEntity } from 'src/utils/types/db.types';

@Controller('adverts')
export class AdvertController {
  constructor(private readonly advertService: AdvertService) {}

  @Post('free-advert')
  @UseGuards(RolesGuard)
  @UseInterceptors(FileInterceptor('image'))
  async create(
    @Body() createAdvertDto: CreateFreeAdvertDto,
    @UploadedFile() image: MulterFile,
    @Req() req: Request,
  ) {
    if (!image) {
      throw new BadRequestException('Advertisement image is required');
    }

    const user = req.user as UserEntity;
    createAdvertDto.creatorId = user.id;
    createAdvertDto.type = AdvertTypeEnum.FREE;
    createAdvertDto.amount = 0;

    const advert = await this.advertService.createFreeAd(
      createAdvertDto,
      image,
    );
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

  @Post('click/:id')
  async trackClick(@Param('id') id: string) {
    await this.advertService.trackClick(id);
    return ResponseDto.createSuccessResponse('Click tracked successfully');
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @UseInterceptors(FileInterceptor('image'))
  async update(
    @Param('id') id: string,
    @Body() updateAdvertDto: UpdateAdvertDto,
    @UploadedFile() image: MulterFile,
    @Req() req: Request,
  ) {
    const user = req.user as UserEntity;
    const updatedAdvert = await this.advertService.update(
      id,
      updateAdvertDto,
      user.id,
      image,
    );
    return ResponseDto.createSuccessResponse(
      'Advertisement updated successfully',
      updatedAdvert,
    );
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  async remove(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as UserEntity;
    const deletedAdvert = await this.advertService.remove(id, user.id);
    return ResponseDto.createSuccessResponse(
      'Advertisement deleted successfully',
      deletedAdvert,
    );
  }
}
