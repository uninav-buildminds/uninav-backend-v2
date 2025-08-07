import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { FacultyService } from './faculty.service';
import { CreateFacultyDto } from './dto/create-faculty.dto';
import { UpdateFacultyDto } from './dto/update-faculty.dto';
import { ResponseDto } from 'src/utils/globalDto/response.dto';
import { RolesGuard } from 'src/guards/roles.guard';
import { Roles } from 'src/utils/decorators/roles.decorator';
import { UserRoleEnum } from 'src/utils/types/db.types';
import { CacheControlInterceptor } from 'src/interceptors/cache-control.interceptor';
import { CacheControl } from 'src/utils/decorators/cache-control.decorator';

@ApiTags('Faculty')
@Controller('faculty')
@UseInterceptors(CacheControlInterceptor)
export class FacultyController {
  constructor(private readonly facultyService: FacultyService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRoleEnum.ADMIN)
  async create(@Body() createFacultyDto: CreateFacultyDto) {
    const faculty = await this.facultyService.create(createFacultyDto);
    return ResponseDto.createSuccessResponse(
      'Faculty created successfully',
      faculty,
    );
  }

  @Get()
  @CacheControl({ public: true, maxAge: 3600 * 24 }) // Cache for 1 day
  async findAll() {
    const faculties = await this.facultyService.findAll();
    return ResponseDto.createSuccessResponse(
      'Faculties retrieved successfully',
      faculties,
    );
  }

  @Get(':id')
  @CacheControl({ public: true, maxAge: 3600 * 24 }) // Cache for 1 day
  async findOne(@Param('id') id: string) {
    const faculty = await this.facultyService.findOne(id);
    return ResponseDto.createSuccessResponse(
      'Faculty retrieved successfully',
      faculty,
    );
  }
}
