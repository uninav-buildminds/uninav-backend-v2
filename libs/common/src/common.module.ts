import { EventsEmitter } from '@app/common/modules/events/events.emitter';
import { Global, Module } from '@nestjs/common';
import { StructuredLoggerService } from '@app/common/modules/logger/structured-logger.service';
import { DatabaseModule } from '@app/common/modules/database';

@Global()
@Module({
  imports: [DatabaseModule],
  providers: [EventsEmitter, StructuredLoggerService],
  exports: [EventsEmitter, StructuredLoggerService],
})
export class CommonModule {}
