import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ErrorReportsRepository } from './error-reports.repository';
import { CreateErrorReportDto } from './dto/create-error-report.dto';
import { UpdateErrorReportDto } from './dto/update-error-report.dto';
import { QueryErrorReportsDto } from './dto/query-error-reports.dto';

@Injectable()
export class ErrorReportsService {
  private readonly logger = new Logger(ErrorReportsService.name);

  constructor(private readonly repo: ErrorReportsRepository) {}

  /**
   * Create a new error report
   * Can be called by authenticated users or anonymously
   */
  async create(payload: CreateErrorReportDto, userId?: string) {
    this.logger.log(`Creating error report: ${payload.title}`);

    // Log the error for immediate developer awareness
    this.logger.error(`Error Report Created: ${payload.errorType}`, {
      title: payload.title,
      description: payload.description,
      userId,
      url: payload.url,
      userAgent: payload.userAgent,
      errorDetails: payload.errorDetails,
    });

    return this.repo.create({ ...payload, userId });
  }

  /**
   * Get all error reports with filtering and pagination
   * Admin/Moderator only
   */
  async list(options: QueryErrorReportsDto) {
    return this.repo.list(options);
  }

  /**
   * Get a specific error report by ID
   * Admin/Moderator only
   */
  async findById(id: string) {
    const errorReport = await this.repo.findById(id);
    if (!errorReport) {
      throw new NotFoundException(`Error report with ID ${id} not found`);
    }
    return errorReport;
  }

  /**
   * Update an error report (typically for resolution)
   * Admin/Moderator only
   */
  async update(id: string, payload: UpdateErrorReportDto, resolvedBy?: string) {
    const errorReport = await this.repo.findById(id);
    if (!errorReport) {
      throw new NotFoundException(`Error report with ID ${id} not found`);
    }

    // Set resolvedBy if status is being changed to resolved/closed
    if (
      (payload.status === 'resolved' || payload.status === 'closed') &&
      resolvedBy
    ) {
      payload.resolvedBy = resolvedBy;
    }

    const updated = await this.repo.update(id, payload);

    this.logger.log(`Error report ${id} updated by ${resolvedBy || 'system'}`);

    return updated;
  }

  /**
   * Delete an error report
   * Admin only
   */
  async delete(id: string) {
    const errorReport = await this.repo.findById(id);
    if (!errorReport) {
      throw new NotFoundException(`Error report with ID ${id} not found`);
    }

    return this.repo.delete(id);
  }

  /**
   * Get error statistics for admin dashboard
   */
  async getStats() {
    return this.repo.getStats();
  }

  /**
   * Get error reports for a specific user
   */
  async getUserReports(userId: string, options: Partial<QueryErrorReportsDto>) {
    return this.repo.list({ ...options, userId });
  }
}
