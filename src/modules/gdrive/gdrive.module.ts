import { Module } from '@nestjs/common';
import { GDriveController } from './gdrive.controller';
import { GDriveService } from './gdrive.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  controllers: [GDriveController],
  providers: [GDriveService],
  exports: [GDriveService],
})
export class GDriveModule {}
