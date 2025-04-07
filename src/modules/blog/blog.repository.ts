import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE_SYMBOL } from 'src/utils/config/constants.config';
import { BlogEntity, BlogTypeEnum, DrizzleDB } from 'src/utils/types/db.types';
import { blogs } from 'src/modules/drizzle/schema/blog.schema';
import { comments } from 'src/modules/drizzle/schema/comments.schema';
import { blogLikes } from 'src/modules/drizzle/schema/blog-likes.schema';
import { eq, desc, and, sql, like, or, ilike } from 'drizzle-orm';
import { CreateCommentDto } from './dto/create-comment.dto';

@Injectable()
export class BlogRepository {
  constructor(@Inject(DRIZZLE_SYMBOL) private readonly db: DrizzleDB) {}

  async create(blogData: BlogEntity): Promise<BlogEntity> {
    const result = await this.db.insert(blogs).values(blogData).returning();
    return result[0];
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    type?: BlogTypeEnum,
  ): Promise<{
    data: BlogEntity[];
    pagination: {
      page: number;
      limit: number;
      totalItems: number;
      totalPages: number;
      hasMore: boolean;
      hasPrev: boolean;
    };
  }> {
    const offset = (page - 1) * limit;

    // Apply type filter if provided
    const whereClause = type ? eq(blogs.type, type) : undefined;

    // Get total count for pagination
    const countResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(blogs)
      .where(whereClause)
      .execute();

    const totalItems = Number(countResult[0]?.count || 0);
    const totalPages = Math.ceil(totalItems / limit);

    const data = await this.db.query.blogs.findMany({
      where: whereClause,
      orderBy: [desc(blogs.createdAt)],
      with: {
        creator: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
          },
        },
      },
      offset,
      limit,
    });

    return {
      data,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages,
        hasMore: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  async findOne(id: string): Promise<BlogEntity> {
    return this.db.query.blogs.findFirst({
      where: eq(blogs.id, id),
      with: {
        creator: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
          },
        },
        comments: {
          orderBy: [desc(comments.createdAt)],
          with: {
            user: {
              columns: {
                id: true,
                firstName: true,
                lastName: true,
                username: true,
              },
            },
          },
        },
      },
    });
  }

  async findByCreator(
    creatorId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    data: BlogEntity[];
    pagination: {
      page: number;
      limit: number;
      totalItems: number;
      totalPages: number;
      hasMore: boolean;
      hasPrev: boolean;
    };
  }> {
    const offset = (page - 1) * limit;

    // Get total count for pagination
    const countResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(blogs)
      .where(eq(blogs.creatorId, creatorId))
      .execute();

    const totalItems = Number(countResult[0]?.count || 0);
    const totalPages = Math.ceil(totalItems / limit);

    const data = await this.db.query.blogs.findMany({
      where: eq(blogs.creatorId, creatorId),
      orderBy: [desc(blogs.createdAt)],
      with: {
        creator: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
          },
        },
      },
      offset,
      limit,
    });

    return {
      data,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages,
        hasMore: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  async search(
    query: string,
    page: number = 1,
    limit: number = 10,
    type?: BlogTypeEnum,
  ): Promise<{
    data: BlogEntity[];
    pagination: {
      page: number;
      limit: number;
      totalItems: number;
      totalPages: number;
      hasMore: boolean;
      hasPrev: boolean;
    };
  }> {
    const offset = (page - 1) * limit;
    const searchTerm = `%${query}%`;

    // Build search conditions
    const searchConditions = or(
      ilike(blogs.title, searchTerm),
      ilike(blogs.description, searchTerm),
      sql`${query} = ANY(${blogs.tags})`,
    );

    // Add type filter if provided
    const whereCondition = type
      ? and(eq(blogs.type, type), searchConditions)
      : searchConditions;

    // Get total count for pagination
    const countResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(blogs)
      .where(whereCondition)
      .execute();

    const totalItems = Number(countResult[0]?.count || 0);
    const totalPages = Math.ceil(totalItems / limit);

    const data = await this.db.query.blogs.findMany({
      where: whereCondition,
      orderBy: [desc(blogs.createdAt)],
      with: {
        creator: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
          },
        },
      },
      offset,
      limit,
    });

    return {
      data,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages,
        hasMore: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  async update(
    id: string,
    updateData: Partial<BlogEntity>,
  ): Promise<BlogEntity> {
    const result = await this.db
      .update(blogs)
      .set({ ...updateData, updatedAt: new Date() } as any)
      .where(eq(blogs.id, id))
      .returning();
    return result[0];
  }

  async remove(id: string): Promise<{ id: string }> {
    const result = await this.db
      .delete(blogs)
      .where(eq(blogs.id, id))
      .returning({ id: blogs.id });
    return result[0];
  }

  async hasUserLikedBlog(blogId: string, userId: string): Promise<boolean> {
    const result = await this.db.query.blogLikes.findFirst({
      where: and(eq(blogLikes.blogId, blogId), eq(blogLikes.userId, userId)),
    });

    return !!result;
  }

  async addUserLike(blogId: string, userId: string): Promise<void> {
    await this.db.insert(blogLikes).values({
      blogId,
      userId,
    });
  }

  async removeUserLike(blogId: string, userId: string): Promise<void> {
    await this.db
      .delete(blogLikes)
      .where(and(eq(blogLikes.blogId, blogId), eq(blogLikes.userId, userId)));
  }

  async incrementLikes(id: string): Promise<BlogEntity> {
    const result = await this.db
      .update(blogs)
      .set({
        likes: sql`${blogs.likes} + 1`,
      } as any)
      .where(eq(blogs.id, id))
      .returning();
    return result[0];
  }

  async decrementLikes(id: string): Promise<BlogEntity> {
    const result = await this.db
      .update(blogs)
      .set({
        likes: sql`${blogs.likes} - 1`,
      } as any)
      .where(eq(blogs.id, id))
      .returning();
    return result[0];
  }

  async incrementViews(id: string): Promise<void> {
    await this.db
      .update(blogs)
      .set({
        views: sql`${blogs.views} + 1`,
      } as any)
      .where(eq(blogs.id, id));
  }

  async incrementClicks(id: string): Promise<void> {
    await this.db
      .update(blogs)
      .set({
        clicks: sql`${blogs.clicks} + 1`,
      } as any)
      .where(eq(blogs.id, id));
  }

  // Comment operations
  async createComment(commentData: CreateCommentDto): Promise<any> {
    const result = await this.db
      .insert(comments)
      .values(commentData)
      .returning();
    return result[0];
  }

  async getComments(
    blogId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    data: any[];
    pagination: {
      page: number;
      limit: number;
      totalItems: number;
      totalPages: number;
      hasMore: boolean;
      hasPrev: boolean;
    };
  }> {
    const offset = (page - 1) * limit;

    // Get total count for pagination
    const countResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(comments)
      .where(eq(comments.blogId, blogId))
      .execute();

    const totalItems = Number(countResult[0]?.count || 0);
    const totalPages = Math.ceil(totalItems / limit);

    const data = await this.db.query.comments.findMany({
      where: eq(comments.blogId, blogId),
      orderBy: [desc(comments.createdAt)],
      with: {
        user: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
          },
        },
      },
      offset,
      limit,
    });

    return {
      data,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages,
        hasMore: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  async deleteComment(commentId: string, userId: string): Promise<boolean> {
    const result = await this.db
      .delete(comments)
      .where(and(eq(comments.id, commentId), eq(comments.userId, userId)))
      .returning({ id: comments.id });

    return result.length > 0;
  }
}
