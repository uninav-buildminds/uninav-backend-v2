import { Module } from '@nestjs/common';
import { DatabaseModule } from '@app/common/modules/database';
import { NotificationsService } from './notifications.service';
import { NotificationsRepository } from './notifications.repository';
import { NotificationsController } from './notifications.controller';

@Module({
  imports: [DatabaseModule],
  providers: [NotificationsService, NotificationsRepository],
  controllers: [NotificationsController],
  exports: [NotificationsService, NotificationsRepository],
})
export class NotificationsModule {}
