import { Inject, Injectable } from '@nestjs/common';
import { DrizzleDB } from 'src/utils/types/db.types';
import { DRIZZLE_SYMBOL } from 'src/utils/config/constants.config';
import { admin } from '../../../../../libs/common/src/modules/database/schema/admin.schema';
import { users } from '../../../../../libs/common/src/modules/database/schema/user.schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class AdminRepository {
  constructor(@Inject(DRIZZLE_SYMBOL) private readonly db: DrizzleDB) {}

  async create(userId: string) {
    const [result] = await this.db
      .insert(admin)
      .values({
        userId,
      })
      .returning();
    return result;
  }

  async findById(userId: string) {
    const result = await this.db
      .select()
      .from(admin)
      .where(eq(admin.userId, userId))
      .leftJoin(users, eq(admin.userId, users.id));
    return result[0];
  }
}
