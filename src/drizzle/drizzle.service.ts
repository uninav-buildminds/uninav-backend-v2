import { Inject, Injectable } from '@nestjs/common';
// import { Cron, CronExpression } from '@nestjs/schedule';
import { DRIZZLE_SYMBOL } from 'src/utils/config/constants.config';
import { DrizzleDB } from 'src/utils/types/db.types';

@Injectable()
export class DrizzleService {
  constructor(@Inject(DRIZZLE_SYMBOL) private db: DrizzleDB) {}
}
