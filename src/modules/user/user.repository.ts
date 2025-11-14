import { Inject, Injectable } from '@nestjs/common';
import { users } from '@app/common/modules/database/schema/user.schema';
import { CreateUserDto } from 'src/modules/user/dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { DRIZZLE_SYMBOL } from 'src/utils/config/constants.config';
import { DrizzleDB } from '@app/common/types/db.types';
import { eq, or, and, inArray, isNull, ilike } from 'drizzle-orm';
import {
  userCourses,
  bookmarks,
} from '@app/common/modules/database/schema/user.schema';
import { AddBookmarkDto } from './dto/bookmark.dto';
import { sql } from 'drizzle-orm';

@Injectable()
export class UserRepository {
  constructor(@Inject(DRIZZLE_SYMBOL) private readonly db: DrizzleDB) {}

  async create(createUserDto: CreateUserDto & { username: string }) {
    const valuesToInsert = { ...createUserDto };
    if (valuesToInsert.googleId === undefined) {
      delete valuesToInsert.googleId;
    }

    const createdUser = await this.db
      .insert(users)
      .values([valuesToInsert])
      .returning();
    return createdUser[0];
  }

  async findById(id: string) {
    return this.db.query.users.findFirst({
      where: (user, { eq }) => eq(user.id, id),
      with: {
        department: true,
      },
    });
  }
  async getProfile(id: string) {
    const user = await this.db.query.users.findFirst({
      where: (user, { eq }) => eq(user.id, id),
      with: {
        department: true,
        auth: true,
        courses: {
          with: {
            course: true,
          },
        },
      },
    });

    if (!user) {
      return null;
    }

    // Count bookmarks for this user
    const bookmarkCountResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(bookmarks)
      .where(eq(bookmarks.userId, id))
      .execute();

    const bookmarkCount = Number(bookmarkCountResult[0]?.count || 0);

    return {
      ...user,
      bookmarkCount,
    };
  }

  async findByEmail(email: string) {
    return this.db.query.users.findFirst({
      where: (user, { eq }) => eq(user.email, email),
    });
  }

  async findByUsername(username: string) {
    return this.db.query.users.findFirst({
      where: (user, { eq }) => eq(user.username, username),
      columns: {
        id: true,
        firstName: true,
        lastName: true,
        username: true,
        email: true,
        level: true,
        departmentId: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      with: {
        department: true,
      },
    });
  }

  async findByGoogleId(googleId: string) {
    return this.db.query.users.findFirst({
      where: (user, { eq }) => eq(user.googleId, googleId),
    });
  }

  async findByEmailOrUsername(emailOrUsername: string) {
    return this.db.query.users.findFirst({
      where: (userTable, { or, eq }) =>
        or(
          eq(userTable.email, emailOrUsername),
          eq(userTable.username, emailOrUsername),
        ),
    });
  }

  async findAll() {
    return this.db.query.users.findMany({
      with: {
        department: true,
      },
    });
  }

  async findAllWithRelations(limit: number, offset: number, query?: string) {
    const conditions = [];
    if (query) {
      const searchTerm = `%${query}%`;
      conditions.push(
        or(
          ilike(users.firstName, searchTerm),
          ilike(users.lastName, searchTerm),
          ilike(users.email, searchTerm),
          ilike(users.username, searchTerm),
        ),
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    return this.db.query.users.findMany({
      where: whereClause,
      with: {
        department: true,
        auth: {
          columns: {
            emailVerified: true,
          },
        },
        courses: {
          with: {
            course: true,
          },
        },
      },
      limit: limit,
      offset: offset,
      orderBy: (users, { desc }) => [desc(users.createdAt)],
    });
  }

  async countAll(query?: string) {
    const conditions = [];
    if (query) {
      const searchTerm = `%${query}%`;
      conditions.push(
        or(
          ilike(users.firstName, searchTerm),
          ilike(users.lastName, searchTerm),
          ilike(users.email, searchTerm),
          ilike(users.username, searchTerm),
        ),
      );
    }
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const result = await this.db
      .select({ count: sql`count(*)` })
      .from(users)
      .where(whereClause);
    return parseInt(result[0].count as string, 10);
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const valuesToUpdate = { ...updateUserDto, updatedAt: new Date() };

    const updatedUser = await this.db
      .update(users)
      .set(valuesToUpdate as any)
      .where(eq(users.id, id))
      .returning();

    return updatedUser[0];
  }

  async remove(id: string) {
    const deletedUser = await this.db
      .delete(users)
      .where(eq(users.id, id))
      .returning({ id: users.id });

    return deletedUser[0];
  }

  async addUserCourses(userId: string, courseIds: string[]) {
    const values = courseIds.map((courseId) => ({
      userId,
      courseId,
    }));

    const result = await this.db
      .insert(userCourses)
      .values(values)
      .onConflictDoNothing()
      .returning();

    return result;
  }

  async removeUserCourses(userId: string, courseIds: string[]) {
    const result = await this.db
      .delete(userCourses)
      .where(
        and(
          eq(userCourses.userId, userId),
          inArray(userCourses.courseId, courseIds),
        ),
      )
      .returning();

    return result;
  }

  async deleteAllUserCourses(userId: string) {
    return this.db
      .delete(userCourses)
      .where(eq(userCourses.userId, userId))
      .returning();
  }

  async getUserCourses(userId: string) {
    return this.db.query.userCourses.findMany({
      where: eq(userCourses.userId, userId),
      with: {
        course: true,
      },
    });
  }

  async addBookmark(userId: string, bookmarkDto: AddBookmarkDto) {
    const bookmark = await this.db
      .insert(bookmarks)
      .values({
        userId,
        ...bookmarkDto,
      } as any)
      .returning();

    return bookmark[0];
  }

  async findBookmarkById(bookmarkId: string) {
    return this.db.query.bookmarks.findFirst({
      where: (bookmark) => eq(bookmark.id, bookmarkId),
      with: {
        material: true,
        folder: true,
      },
    });
  }

  async removeBookmark(bookmarkId: string) {
    const removed = await this.db
      .delete(bookmarks)
      .where(eq(bookmarks.id, bookmarkId))
      .returning();

    return removed[0];
  }

  async getUserBookmarks(userId: string) {
    return this.db.query.bookmarks.findMany({
      where: eq(bookmarks.userId, userId),
      with: {
        material: {
          with: {
            creator: {
              columns: {
                id: true,
                firstName: true,
                lastName: true,
                username: true,
                level: true,
                departmentId: true,
              },
            },
          },
        },
        folder: true,
      },
    });
  }

  async findBookmarkByMaterial(userId: string, materialId: string) {
    return this.db.query.bookmarks.findFirst({
      where: and(
        eq(bookmarks.userId, userId),
        eq(bookmarks.materialId, materialId),
      ),
    });
  }

  async findBookmarkByFolder(userId: string, folderId: string) {
    return this.db.query.bookmarks.findFirst({
      where: and(
        eq(bookmarks.userId, userId),
        eq(bookmarks.folderId, folderId),
      ),
    });
  }

  async findBookmark(userId: string, materialId: string) {
    return this.db.query.bookmarks.findFirst({
      where: and(
        eq(bookmarks.userId, userId),
        eq(bookmarks.materialId, materialId),
      ),
    });
  }

  async incrementUploadCount(userId: string) {
    await this.db
      .update(users)
      .set({ uploadCount: sql`${users.uploadCount} + 1` } as any)
      .where(eq(users.id, userId));
  }

  async incrementDownloadCount(userId: string) {
    await this.db
      .update(users)
      .set({ downloadCount: sql`${users.downloadCount} + 1` } as any)
      .where(eq(users.id, userId));
  }
}
