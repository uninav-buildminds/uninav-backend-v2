import { Inject, Injectable } from '@nestjs/common';
import { user } from 'src/drizzle/schema/user.schema';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { DRIZZLE_SYMBOL } from 'src/utils/config/constants.config';
import { DrizzleDB } from 'src/utils/types/db.types';

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
}
