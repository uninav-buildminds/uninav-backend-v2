import { Module } from '@nestjs/common';
import { TutorialsService } from './tutorials.service';
import { TutorialsController } from './tutorials.controller';
import { TutorialsRepository } from './tutorials.repository';
import { DatabaseModule } from '@app/common/modules/database/database.module';
import { UserModule } from 'src/modules/user/user.module';

@Module({
  imports: [DatabaseModule, UserModule],
  controllers: [TutorialsController],
  providers: [TutorialsService, TutorialsRepository],
  exports: [TutorialsService],
})
export class TutorialsModule {}
