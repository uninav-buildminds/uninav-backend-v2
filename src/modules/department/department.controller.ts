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
import { DepartmentService } from './department.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { ResponseDto } from 'src/utils/globalDto/response.dto';
import { RolesGuard } from 'src/guards/roles.guard';
import { Roles } from 'src/utils/decorators/roles.decorator';
import { UserRoleEnum } from 'src/utils/types/db.types';

@Controller('department')
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
  async findAll() {
    const departments = await this.departmentService.findAll();
    return ResponseDto.createSuccessResponse(
      'Departments retrieved successfully',
      departments,
    );
  }

  @Get(':id')
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
