import { EventsEmitter } from '@app/common/modules/events/events.emitter';
import { Global, Module } from '@nestjs/common';
import { StructuredLoggerService } from '@app/common/modules/logger/structured-logger.service';

@Global()
@Module({
  providers: [EventsEmitter, StructuredLoggerService],
  exports: [EventsEmitter, StructuredLoggerService],
})
export class CommonModule {}
