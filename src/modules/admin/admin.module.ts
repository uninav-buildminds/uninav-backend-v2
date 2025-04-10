import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminRepository } from './admin.repository';
import { DrizzleModule } from 'src/modules/drizzle/drizzle.module';

@Module({
  imports: [DrizzleModule],
  providers: [AdminService, AdminRepository],
  exports: [AdminService],
})
export class AdminModule {}
