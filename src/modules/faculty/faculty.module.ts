import { forwardRef, Module } from '@nestjs/common';
import { FacultyService } from './faculty.service';
import { FacultyController } from './faculty.controller';
import { FacultyRepository } from './faculty.repository';
import { DatabaseModule } from '@app/common/modules/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [FacultyController],
  providers: [FacultyService, FacultyRepository],
  exports: [FacultyService],
})
export class FacultyModule {}
