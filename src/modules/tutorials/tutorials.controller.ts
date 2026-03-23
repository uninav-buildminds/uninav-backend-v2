import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  Req,
  ParseUUIDPipe,
  UseInterceptors,
} from '@nestjs/common';
import { TutorialsService } from './tutorials.service';
import { TutorialFilterDto } from './dto/tutorial-filter.dto';
import { RolesGuard } from '@app/common/guards/roles.guard';
import { Request } from 'express';
import { UserEntity } from '@app/common/types/db.types';
import { ResponseDto } from '@app/common/dto/response.dto';
import { CacheControlInterceptor } from '@app/common/interceptors/cache-control.interceptor';

@Controller('tutorials')
@UseInterceptors(CacheControlInterceptor)
export class TutorialsController {
  constructor(private readonly tutorialsService: TutorialsService) {}

  @Get()
  async findAll(@Query() filters: TutorialFilterDto) {
    const data = await this.tutorialsService.findAll(filters);
    return ResponseDto.createSuccessResponse(
      'Tutorials retrieved successfully',
      data,
    );
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.tutorialsService.findOne(id);
    return ResponseDto.createSuccessResponse(
      'Tutorial retrieved successfully',
      data,
    );
  }

  @Post(':id/enroll')
  @UseGuards(RolesGuard)
  async enroll(@Param('id', ParseUUIDPipe) id: string, @Req() req: Request) {
    const user = req.user as UserEntity;
    const data = await this.tutorialsService.enroll(user.id, id);
    return ResponseDto.createSuccessResponse(
      'Enrolled in tutorial successfully',
      data,
    );
  }
}
