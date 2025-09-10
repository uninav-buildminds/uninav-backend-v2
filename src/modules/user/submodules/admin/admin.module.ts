import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminRepository } from './admin.repository';
import { DatabaseModule } from '@app/common/modules/database/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [AdminService, AdminRepository],
  exports: [AdminService],
})
export class AdminModule {}
