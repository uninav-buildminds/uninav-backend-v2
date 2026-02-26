import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { RolesGuard } from '@app/common/guards/roles.guard';
import { Roles } from '@app/common/decorators/roles.decorator';
import { ErrorReportsService } from './error-reports.service';
import { CreateErrorReportDto } from './dto/create-error-report.dto';
import { UpdateErrorReportDto } from './dto/update-error-report.dto';
import { QueryErrorReportsDto } from './dto/query-error-reports.dto';
import { ResponseDto } from '@app/common/dto/response.dto';
import { Request } from 'express';
import { UserRoleEnum } from '@app/common/types/db.types';

@Controller('error-reports')
export class ErrorReportsController {
  constructor(private readonly errorReportsService: ErrorReportsService) {}

  /**
   * Create a new error report
   * Public endpoint - can be used by authenticated or anonymous users
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createDto: CreateErrorReportDto, @Req() req: Request) {
    // Extract user ID if authenticated, otherwise allow anonymous reporting
    const user = req.user as any;
    const userId = user?.id;

    const errorReport = await this.errorReportsService.create(
      createDto,
      userId,
    );

    return ResponseDto.createSuccessResponse(
      'Error report submitted successfully. Our team has been notified.',
      errorReport,
    );
  }

  /**
   * Get all error reports with filtering and pagination
   * Admin/Moderator only
   */
  @Get()
  @UseGuards(RolesGuard)
  @Roles([UserRoleEnum.ADMIN, UserRoleEnum.MODERATOR])
  async list(@Query() queryDto: QueryErrorReportsDto) {
    const result = await this.errorReportsService.list(queryDto);
    return ResponseDto.createSuccessResponse(
      'Error reports retrieved successfully',
      result,
    );
  }

  /**
   * Get error statistics for admin dashboard
   * Admin/Moderator only
   */
  @Get('stats')
  @UseGuards(RolesGuard)
  @Roles([UserRoleEnum.ADMIN, UserRoleEnum.MODERATOR])
  async getStats() {
    const stats = await this.errorReportsService.getStats();
    return ResponseDto.createSuccessResponse(
      'Error statistics retrieved successfully',
      stats,
    );
  }

  /**
   * Get current user's error reports
   * Authenticated users only
   */
  @Get('my-reports')
  @UseGuards(RolesGuard)
  async getMyReports(
    @Req() req: Request,
    @Query() queryDto: QueryErrorReportsDto,
  ) {
    const user = req.user as any;
    const result = await this.errorReportsService.getUserReports(
      user.id,
      queryDto,
    );
    return ResponseDto.createSuccessResponse(
      'Your error reports retrieved successfully',
      result,
    );
  }

  /**
   * Get a specific error report by ID
   * Admin/Moderator only
   */
  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles([UserRoleEnum.ADMIN, UserRoleEnum.MODERATOR])
  async findById(@Param('id') id: string) {
    const errorReport = await this.errorReportsService.findById(id);
    return ResponseDto.createSuccessResponse(
      'Error report retrieved successfully',
      errorReport,
    );
  }

  /**
   * Update an error report (typically for resolution)
   * Admin/Moderator only
   */
  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles([UserRoleEnum.ADMIN, UserRoleEnum.MODERATOR])
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateErrorReportDto,
    @Req() req: Request,
  ) {
    const user = req.user as any;
    const errorReport = await this.errorReportsService.update(
      id,
      updateDto,
      user.id,
    );

    return ResponseDto.createSuccessResponse(
      'Error report updated successfully',
      errorReport,
    );
  }

  /**
   * Delete an error report
   * Admin only
   */
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles([UserRoleEnum.ADMIN])
  @HttpCode(HttpStatus.OK)
  async delete(@Param('id') id: string) {
    await this.errorReportsService.delete(id);
    return ResponseDto.createSuccessResponse(
      'Error report deleted successfully',
      true,
    );
  }
}
