import { EventsEmitter } from '@app/common/modules/events/events.emitter';
import { Global, Module } from '@nestjs/common';

@Global()
@Module({
  providers: [EventsEmitter],
  exports: [EventsEmitter],
})
export class CommonModule {}
