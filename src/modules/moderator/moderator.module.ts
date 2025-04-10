import { Module } from '@nestjs/common';
import { ModeratorService } from './moderator.service';
import { ModeratorRepository } from './moderator.repository';

@Module({
  providers: [ModeratorService, ModeratorRepository],
  exports: [ModeratorService],
})
export class ModeratorModule {}
