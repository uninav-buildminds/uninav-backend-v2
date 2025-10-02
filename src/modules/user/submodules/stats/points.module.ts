import { Module } from '@nestjs/common';
import { PointsService } from './points.service';
import { PointsController } from './points.controller';
import { PointsRepository } from './points.repository';
import { DatabaseModule } from '@app/common/modules/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [PointsController],
  providers: [PointsService, PointsRepository],
  exports: [PointsService],
})
export class PointsModule {}

