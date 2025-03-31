import { Inject, Injectable } from '@nestjs/common';
import { user } from 'src/modules/drizzle/schema/user.schema';
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
      .insert(user)
      .values([createUserDto])
      .returning();
    return createdUser[0];
  }

  async findById(id: string) {
    return this.db.query.user.findFirst({
      where: (user, { eq }) => eq(user.id, id),
      with: {
        department: true,
      },
    });
  }

  async findByEmail(email: string) {
    return this.db.query.user.findFirst({
      where: (user, { eq }) => eq(user.email, email),
    });
  }

  async findByUsername(username: string) {
    return this.db.query.user.findFirst({
      where: (user, { eq }) => eq(user.username, username),
    });
  }

  async findByEmailOrUsername(emailOrUsername: string) {
    return this.db.query.user.findFirst({
      where: (userTable, { or, eq }) =>
        or(
          eq(userTable.email, emailOrUsername),
          eq(userTable.username, emailOrUsername),
        ),
    });
  }

  async findAll() {
    return this.db.query.user.findMany({
      with: {
        department: true,
      },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const updatedUser = await this.db
      .update(user)
      .set(updateUserDto)
      .where(eq(user.id, id))
      .returning();

    return updatedUser[0];
  }

  async remove(id: string) {
    const deletedUser = await this.db
      .delete(user)
      .where(eq(user.id, id))
      .returning({ id: user.id });

    return deletedUser[0];
  }
}
