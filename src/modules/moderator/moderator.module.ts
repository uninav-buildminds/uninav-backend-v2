import { Module } from '@nestjs/common';
import { ModeratorService } from './moderator.service';
import { ModeratorRepository } from './moderator.repository';
import { DrizzleModule } from 'src/modules/drizzle/drizzle.module';

@Module({
  imports: [DrizzleModule],
  providers: [ModeratorService, ModeratorRepository],
  exports: [ModeratorService],
})
export class ModeratorModule {}
