import { Logger, Module } from '@nestjs/common';
import { MaterialService } from './material.service';
import { MaterialController } from './material.controller';
import { MaterialRepository } from './material.repository';
import { DrizzleModule } from 'src/modules/drizzle/drizzle.module';
import { StorageService } from 'src/storage/storage.service';

@Module({
  imports: [DrizzleModule],
  controllers: [MaterialController],
  providers: [MaterialService, MaterialRepository, StorageService],
  exports: [MaterialService],
})
export class MaterialModule {}

export const materialLogger = new Logger(MaterialModule.name);
