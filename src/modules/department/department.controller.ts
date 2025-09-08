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
import { DepartmentService } from './department.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { ResponseDto } from '@app/common/dto/response.dto';
import { RolesGuard } from '@app/common/guards/roles.guard';
import { Roles } from '@app/common/decorators/roles.decorator';
import { UserRoleEnum } from '@app/common/types/db.types';
import { CacheControlInterceptor } from '@app/common/interceptors/cache-control.interceptor';
import { CacheControl } from '@app/common/decorators/cache-control.decorator';
@Controller('department')
@UseInterceptors(CacheControlInterceptor)
export class DepartmentController {
  constructor(private readonly departmentService: DepartmentService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRoleEnum.ADMIN)
  async create(@Body() createDepartmentDto: CreateDepartmentDto) {
    const department = await this.departmentService.create(createDepartmentDto);
    return ResponseDto.createSuccessResponse(
      'Department created successfully',
      department,
    );
  }

  @Get()
  @CacheControl({ public: true, maxAge: 3600 * 24 }) // Cache for 1 day
  async findAll() {
    const departments = await this.departmentService.findAll();
    return ResponseDto.createSuccessResponse(
      'Departments retrieved successfully',
      departments,
    );
  }

  @Get(':id')
  @CacheControl({ public: true, maxAge: 3600 * 24 })
  async findOne(@Param('id') id: string) {
    const department = await this.departmentService.findOne(id);
    return ResponseDto.createSuccessResponse(
      'Department retrieved successfully',
      department,
    );
  }

  @Get('faculty/:facultyId')
  async findByFaculty(@Param('facultyId') facultyId: string) {
    const departments = await this.departmentService.findByFaculty(facultyId);
    return ResponseDto.createSuccessResponse(
      'Departments retrieved successfully',
      departments,
    );
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRoleEnum.ADMIN)
  async update(
    @Param('id') id: string,
    @Body() updateDepartmentDto: UpdateDepartmentDto,
  ) {
    const department = await this.departmentService.update(
      id,
      updateDepartmentDto,
    );
    return ResponseDto.createSuccessResponse(
      'Department updated successfully',
      department,
    );
  }

  @Delete(':id')
  @Roles(UserRoleEnum.ADMIN)
  async remove(@Param('id') id: string) {
    const department = await this.departmentService.remove(id);
    return ResponseDto.createSuccessResponse(
      'Department deleted successfully',
      department,
    );
  }
}
