import { Global, Module } from '@nestjs/common';
import { EventsEmitter } from 'src/utils/events/events.emitter';

@Global()
@Module({
  providers: [EventsEmitter],
  exports: [EventsEmitter],
})
export class GlobalModule {}
