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
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { FacultyService } from './faculty.service';
import { CreateFacultyDto } from './dto/create-faculty.dto';
import { UpdateFacultyDto } from './dto/update-faculty.dto';
import { ResponseDto } from 'src/utils/globalDto/response.dto';
import { RolesGuard } from 'src/guards/roles.guard';
import { Roles } from 'src/utils/decorators/roles.decorator';
import { UserRoleEnum } from 'src/utils/types/db.types';
import { CacheControlInterceptor } from 'src/interceptors/cache-control.interceptor';
import { CacheControl } from 'src/utils/decorators/cache-control.decorator';
import { FacultyDto } from 'src/utils/swagger/faculty.dto';

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

  @ApiResponse({
    status: 200,
    description: 'Faculties retrieved successfully',
    type: [FacultyDto],
    example: {
      message: 'Faculties retrieved successfully',
      status: 'success',
      data: [
        {
          id: '087dae4c-dfa3-4e7e-b2b9-067736227327',
          name: 'FACULTY OF EDUCATION',
          description:
            'Prepares skilled educators and educational administrators. Focuses on teaching methodologies, educational psychology, and curriculum development.',
          departments: [
            {
              id: '0730e17f-b6ab-4daf-9dae-2bbc82dd8a14',
              name: 'DEPARTMENT OF HUMAN KINETICS AND HEALTH EDUCATION',
              description:
                'Studies physical education, sports science, and health promotion for individual and community wellbeing.',
              facultyId: '087dae4c-dfa3-4e7e-b2b9-067736227327',
            },
            {
              id: '1ff10f06-5b40-468f-b35f-6f57e9306691',
              name: 'DEPARTMENT OF GUIDANCE AND COUNSELLING',
              description:
                'Trains professionals to provide psychological support, career guidance, and personal development counseling.',
              facultyId: '087dae4c-dfa3-4e7e-b2b9-067736227327',
            },
          ],
        },
      ],
    },
  })
  @Get()
  @CacheControl({ public: true, maxAge: 3600 * 24 }) // Cache for 1 day
  async findAll() {
    const faculties = await this.facultyService.findAll();
    return ResponseDto.createSuccessResponse(
      'Faculties retrieved successfully',
      faculties,
    );
  }

  @ApiResponse({
    status: 200,
    description: 'Faculty retrieved successfully',
    type: FacultyDto,
  })
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
