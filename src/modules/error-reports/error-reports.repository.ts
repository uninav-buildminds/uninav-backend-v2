import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE_SYMBOL } from 'src/utils/config/constants.config';
import { DrizzleDB } from '@app/common/types/db.types';
import { and, desc, eq, ilike, or, sql } from 'drizzle-orm';
import { errorReports } from '@app/common/modules/database/schema/error-report.schema';
import { users } from '@app/common/modules/database/schema/user.schema';
import { CreateErrorReportDto } from './dto/create-error-report.dto';
import { UpdateErrorReportDto } from './dto/update-error-report.dto';
import { QueryErrorReportsDto } from './dto/query-error-reports.dto';

@Injectable()
export class ErrorReportsRepository {
  constructor(@Inject(DRIZZLE_SYMBOL) private readonly db: DrizzleDB) {}

  async create(payload: CreateErrorReportDto & { userId?: string }) {
    const result = await this.db
      .insert(errorReports)
      .values({
        ...payload,
        userId: payload.userId || null,
        severity: payload.severity || 'medium',
      } as any)
      .returning();
    return result[0];
  }

  async findById(id: string) {
    const result = await this.db
      .select({
        errorReport: errorReports,
        user: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
        },
        resolvedByUser: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
        },
      })
      .from(errorReports)
      .leftJoin(users, eq(errorReports.userId, users.id))
      .leftJoin(users as any, eq(errorReports.resolvedBy, users.id))
      .where(eq(errorReports.id, id))
      .execute();

    return result[0];
  }

  async list(options: QueryErrorReportsDto) {
    const page = parseInt(options.page || '1', 10);
    const limit = parseInt(options.limit || '10', 10);
    const offset = (page - 1) * limit;

    const conditions = [];

    // Search in title and description
    if (options.query && options.query.trim() !== '') {
      const q = options.query.trim();
      conditions.push(
        or(
          ilike(errorReports.title, `%${q}%`),
          ilike(errorReports.description, `%${q}%`),
        ),
      );
    }

    // Filter by error type
    if (options.errorType) {
      conditions.push(eq(errorReports.errorType, options.errorType));
    }

    // Filter by severity
    if (options.severity) {
      conditions.push(eq(errorReports.severity, options.severity));
    }

    // Filter by status
    if (options.status) {
      conditions.push(eq(errorReports.status, options.status));
    }

    // Filter by user who reported
    if (options.userId) {
      conditions.push(eq(errorReports.userId, options.userId));
    }

    // Filter by who resolved
    if (options.resolvedBy) {
      conditions.push(eq(errorReports.resolvedBy, options.resolvedBy));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const totalResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(errorReports)
      .where(where)
      .execute();
    const total = Number(totalResult[0]?.count || 0);

    // Get items with user information
    const items = await this.db
      .select({
        errorReport: errorReports,
        user: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
        },
      })
      .from(errorReports)
      .leftJoin(users, eq(errorReports.userId, users.id))
      .where(where)
      .orderBy(desc(errorReports.createdAt))
      .limit(limit)
      .offset(offset)
      .execute();

    return {
      items: items.map((item) => ({
        ...item.errorReport,
        user: item.user,
      })),
      pagination: {
        page,
        pageSize: limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async update(id: string, payload: UpdateErrorReportDto) {
    const updateData: any = {
      ...payload,
      updatedAt: new Date(),
    };

    // Set resolved timestamp if status is being changed to resolved
    if (payload.status === 'resolved' || payload.status === 'closed') {
      updateData.resolvedAt = new Date();
    }

    const result = await this.db
      .update(errorReports)
      .set(updateData)
      .where(eq(errorReports.id, id))
      .returning();

    return result[0];
  }

  async delete(id: string) {
    const result = await this.db
      .delete(errorReports)
      .where(eq(errorReports.id, id))
      .returning();

    return result[0];
  }

  // Get error statistics for admin dashboard
  async getStats() {
    const statusStats = await this.db
      .select({
        status: errorReports.status,
        count: sql<number>`count(*)`,
      })
      .from(errorReports)
      .groupBy(errorReports.status)
      .execute();

    const severityStats = await this.db
      .select({
        severity: errorReports.severity,
        count: sql<number>`count(*)`,
      })
      .from(errorReports)
      .groupBy(errorReports.severity)
      .execute();

    const typeStats = await this.db
      .select({
        errorType: errorReports.errorType,
        count: sql<number>`count(*)`,
      })
      .from(errorReports)
      .groupBy(errorReports.errorType)
      .orderBy(sql`count(*) DESC`)
      .limit(10)
      .execute();

    return {
      statusStats: statusStats.map((stat) => ({
        status: stat.status,
        count: Number(stat.count),
      })),
      severityStats: severityStats.map((stat) => ({
        severity: stat.severity,
        count: Number(stat.count),
      })),
      typeStats: typeStats.map((stat) => ({
        errorType: stat.errorType,
        count: Number(stat.count),
      })),
    };
  }
}
