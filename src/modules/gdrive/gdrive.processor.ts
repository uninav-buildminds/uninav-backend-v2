import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { GDriveService } from './gdrive.service';

@Processor('gdrive-thumbnails')
export class GDriveProcessor extends WorkerHost {
  constructor(private readonly service: GDriveService) {
    super();
  }

  // Process all jobs; use job.name to branch when needed
  async process(job: Job<{ fileId: string; sz?: string }>): Promise<void> {
    if (job.name === 'warm') {
      const { fileId, sz } = job.data;
      await this.service.streamThumbnail(fileId, sz || 's200');
    }
  }
}
