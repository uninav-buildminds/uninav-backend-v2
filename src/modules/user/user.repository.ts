import { Inject, Injectable } from '@nestjs/common';
import { users } from 'src/modules/drizzle/schema/user.schema';
import { CreateUserDto } from 'src/modules/user/dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { DRIZZLE_SYMBOL } from 'src/utils/config/constants.config';
import { DrizzleDB } from 'src/utils/types/db.types';
import { eq, or } from 'drizzle-orm';

@Injectable()
export class UserRepository {
  constructor(@Inject(DRIZZLE_SYMBOL) private readonly db: DrizzleDB) {}

  async create(createUserDto: CreateUserDto) {
    const createdUser = await this.db
      .insert(users)
      .values([createUserDto])
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
    return this.db.query.users.findFirst({
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
  }

  async findByEmail(email: string) {
    return this.db.query.users.findFirst({
      where: (user, { eq }) => eq(user.email, email),
    });
  }

  async findByUsername(username: string) {
    return this.db.query.users.findFirst({
      where: (user, { eq }) => eq(user.username, username),
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

  async update(id: string, updateUserDto: UpdateUserDto) {
    const updatedUser = await this.db
      .update(users)
      .set({ ...updateUserDto, updatedAt: new Date() } as any)
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
}
