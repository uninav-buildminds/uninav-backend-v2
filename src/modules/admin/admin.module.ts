import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminRepository } from './admin.repository';

@Module({
  providers: [AdminService, AdminRepository],
  exports: [AdminService],
})
export class AdminModule {}
