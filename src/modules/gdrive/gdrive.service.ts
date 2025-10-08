import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ENV } from 'src/utils/config/env.enum';

@Injectable()
export class GDriveService {
  private readonly keys: string[];

  constructor(private readonly config: ConfigService) {
    const raw = this.config.get<string>(ENV.GDRIVE_API_KEYS) || '';
    this.keys = raw
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);
  }

  // Return next available API key index for frontend rotation
  getNextKeyIndex(currentIndex?: number): number {
    if (this.keys.length === 0) return 0;

    // If no current index or it's invalid, return first key
    if (
      currentIndex === undefined ||
      currentIndex < 0 ||
      currentIndex >= this.keys.length
    ) {
      return 0;
    }

    // Return next key in rotation
    return (currentIndex + 1) % this.keys.length;
  }

  // Get API key by index (for frontend use)
  getApiKey(index: number): string | null {
    if (index < 0 || index >= this.keys.length) return null;
    return this.keys[index];
  }

  // Get total number of available keys
  getKeyCount(): number {
    return this.keys.length;
  }
}
