import { Inject, Injectable } from '@nestjs/common';
import { auth } from '@app/common/modules/database/schema/auth.schema';
import { DRIZZLE_SYMBOL } from 'src/utils/config/constants.config';
import {
  DrizzleDB,
  AuthEntity,
  UserIdTypeEnum,
} from '@app/common/types/db.types';
import { eq, or } from 'drizzle-orm';

interface CreateAuthEntityDto {
  userId: string;
  email: string;
  password: string;
  matricNo?: string;
  userIdType?: UserIdTypeEnum;
  userIdImage?: string;
}

@Injectable()
export class AuthRepository {
  constructor(@Inject(DRIZZLE_SYMBOL) private readonly db: DrizzleDB) {}

  async create(createAuthDto: CreateAuthEntityDto) {
    const createdAuth = await this.db
      .insert(auth)
      .values(createAuthDto)
      .returning();
    return createdAuth[0];
  }

  async findByEmail(email: string) {
    return this.db.query.auth.findFirst({
      where: (auth, { eq }) => eq(auth.email, email),
      with: {
        user: true,
      },
    });
  }

  async findByMatricNo(matricNo: string) {
    return this.db.query.auth.findFirst({
      where: (auth, { eq }) => eq(auth.matricNo, matricNo),
      with: {
        user: true,
      },
    });
  }

  async findByEmailOrMatricNo(emailOrMatricNo: string) {
    return this.db.query.auth.findFirst({
      where: (authTable, { or, eq }) =>
        or(
          eq(authTable.email, emailOrMatricNo),
          eq(authTable.matricNo, emailOrMatricNo),
        ),
      with: {
        user: true,
      },
    });
  }

  async findByUserId(userId: string) {
    return this.db.query.auth.findFirst({
      where: (auth, { eq }) => eq(auth.userId, userId),
    });
  }

  async updatePassword(userId: string, password: string) {
    const updatedAuth = await this.db
      .update(auth)
      .set({ password })
      .where(eq(auth.userId, userId))
      .returning();

    return updatedAuth[0];
  }

  async updateEmailVerificationStatus(
    userId: string,
    verified: boolean = true,
  ) {
    const updatedAuth = await this.db
      .update(auth)
      .set({
        emailVerified: verified,
      } as any)
      .where(eq(auth.userId, userId))
      .returning();

    return updatedAuth[0];
  }

  async delete(userId: string) {
    await this.db.delete(auth).where(eq(auth.userId, userId));

    return { success: true };
  }

  async savePasswordResetToken(userId: string, token: string, expires: Date) {
    const updatedAuth = await this.db
      .update(auth)
      .set({
        passwordResetToken: token,
        passwordResetExpires: expires,
      } as any)
      .where(eq(auth.userId, userId))
      .returning();

    return updatedAuth[0];
  }

  async clearPasswordResetToken(userId: string) {
    const updatedAuth = await this.db
      .update(auth)
      .set({
        passwordResetToken: null,
        passwordResetExpires: null,
      } as any)
      .where(eq(auth.userId, userId))
      .returning();

    return updatedAuth[0];
  }
}
