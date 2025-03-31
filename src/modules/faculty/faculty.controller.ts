import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { FacultyService } from './faculty.service';
import { CreateFacultyDto } from './dto/create-faculty.dto';
import { UpdateFacultyDto } from './dto/update-faculty.dto';
import { ResponseDto } from 'src/utils/globalDto/response.dto';
import { RolesGuard } from 'src/guards/roles.guard';
import { Roles } from 'src/utils/decorators/roles.decorator';
import { UserRoleEnum } from 'src/utils/types/db.types';

@Controller('faculty')
@UseGuards(RolesGuard)
export class FacultyController {
  constructor(private readonly facultyService: FacultyService) {}

  @Post()
  @Roles(UserRoleEnum.ADMIN)
  async create(@Body() createFacultyDto: CreateFacultyDto) {
    const faculty = await this.facultyService.create(createFacultyDto);
    return ResponseDto.createSuccessResponse(
      'Faculty created successfully',
      faculty,
    );
  }

  @Get()
  async findAll() {
    const faculties = await this.facultyService.findAll();
    return ResponseDto.createSuccessResponse(
      'Faculties retrieved successfully',
      faculties,
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const faculty = await this.facultyService.findOne(id);
    return ResponseDto.createSuccessResponse(
      'Faculty retrieved successfully',
      faculty,
    );
  }

  @Patch(':id')
  @Roles(UserRoleEnum.ADMIN)
  async update(
    @Param('id') id: string,
    @Body() updateFacultyDto: UpdateFacultyDto,
  ) {
    const faculty = await this.facultyService.update(id, updateFacultyDto);
    return ResponseDto.createSuccessResponse(
      'Faculty updated successfully',
      faculty,
    );
  }

  @Delete(':id')
  @Roles(UserRoleEnum.ADMIN)
  async remove(@Param('id') id: string) {
    const faculty = await this.facultyService.remove(id);
    return ResponseDto.createSuccessResponse(
      'Faculty deleted successfully',
      faculty,
    );
  }
}
