import { Module } from '@nestjs/common';
import { FacultyService } from './faculty.service';
import { FacultyController } from './faculty.controller';
import { FacultyRepository } from './faculty.repository';
import { DrizzleModule } from 'src/drizzle/drizzle.module';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [DrizzleModule, UserModule],
  controllers: [FacultyController],
  providers: [FacultyService, FacultyRepository],
  exports: [FacultyService],
})
export class FacultyModule {}
