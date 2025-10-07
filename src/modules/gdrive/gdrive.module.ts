import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { BullModule } from '@nestjs/bullmq';
import { GDriveController } from './gdrive.controller';
import { GDriveService } from './gdrive.service';
import { GDriveProcessor } from './gdrive.processor';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule,
    CacheModule.register({ isGlobal: false }),
    BullModule.registerQueue({ name: 'gdrive-thumbnails' }),
  ],
  controllers: [GDriveController],
  providers: [GDriveService, GDriveProcessor],
  exports: [GDriveService],
})
export class GDriveModule {}
