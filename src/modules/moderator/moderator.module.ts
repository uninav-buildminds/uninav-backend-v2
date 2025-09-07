import { Module } from '@nestjs/common';
import { ModeratorService } from './moderator.service';
import { ModeratorRepository } from './moderator.repository';
import { DatabaseModule } from '@app/common/modules/database/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [ModeratorService, ModeratorRepository],
  exports: [ModeratorService],
})
export class ModeratorModule {}
