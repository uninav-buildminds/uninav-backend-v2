import { Module } from '@nestjs/common';
import { FacultyService } from './faculty.service';
import { FacultyController } from './faculty.controller';
import { FacultyRepository } from './faculty.repository';
import { DrizzleModule } from 'src/drizzle/drizzle.module';

@Module({
  imports: [DrizzleModule],
  controllers: [FacultyController],
  providers: [FacultyService, FacultyRepository],
  exports: [FacultyService],
})
export class FacultyModule {}
