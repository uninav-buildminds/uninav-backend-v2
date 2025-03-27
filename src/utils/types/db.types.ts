import * as schema from 'src/drizzle/schema/schema';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { InferSelectModel } from 'drizzle-orm';
export type DrizzleDB = NodePgDatabase<typeof schema>;

// export type UserEntity = InferSelectModel<typeof schema.user>;
