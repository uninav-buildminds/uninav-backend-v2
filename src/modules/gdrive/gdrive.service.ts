import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { Readable } from 'stream';
import { ENV } from 'src/utils/config/env.enum';

interface KeyState {
  key: string;
  cooldownUntil?: number;
}

@Injectable()
export class GDriveService {
  private readonly baseUrl = 'https://www.googleapis.com/drive/v3';
  private readonly keys: KeyState[];

  constructor(
    @Inject(CACHE_MANAGER) private cache: Cache,
    private readonly config: ConfigService,
  ) {
    const raw = this.config.get<string>(ENV.GDRIVE_API_KEYS) || '';
    this.keys = raw
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean)
      .map((key) => ({ key }));
  }

  private pickKey(): KeyState | undefined {
    const now = Date.now();
    return this.keys.find((k) => !k.cooldownUntil || k.cooldownUntil < now);
  }

  private cooldown(key: KeyState, minutes = 10) {
    key.cooldownUntil = Date.now() + minutes * 60_000;
  }

  private async fetchWithRotation(urlBuilder: (key: string) => string) {
    let lastErr: any;
    for (let i = 0; i < this.keys.length; i++) {
      const slot = this.pickKey();
      if (!slot) break;
      const url = urlBuilder(slot.key);
      try {
        const res = await axios.get(url, { validateStatus: () => true });
        if (res.status === 429 || res.status === 403) {
          this.cooldown(slot, 15);
          lastErr = new Error(`GDrive rate-limited: ${res.status}`);
          continue;
        }
        if (res.status < 200 || res.status >= 300) {
          lastErr = new Error(`GDrive error: ${res.status} ${res.statusText}`);
          continue;
        }
        return res;
      } catch (e: any) {
        lastErr = e;
        continue;
      }
    }
    throw lastErr || new Error('No available Google Drive API keys');
  }

  async streamThumbnail(fileId: string, sz: string) {
    const cacheKey = `gdrive:thumb:${fileId}:${sz}`;
    const cached: { contentType?: string; buffer: Buffer } | undefined =
      await this.cache.get(cacheKey);
    if (cached) {
      return {
        contentType: cached.contentType,
        stream: Readable.from(cached.buffer),
      };
    }

    const urlBuilder = (key: string) =>
      `${this.baseUrl}/files/${fileId}?fields=thumbnailLink,mimeType&key=${key}`;

    // Get metadata to compute thumbnail URL
    const metaRes = await this.fetchWithRotation(urlBuilder);
    const meta = metaRes.data;
    const sizeParam = sz || 's200';
    // Prefer stable endpoint
    const thumbnailUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=${encodeURIComponent(
      sizeParam,
    )}`;

    // Fetch the image
    const imgRes = await axios.get<ArrayBuffer>(thumbnailUrl, {
      responseType: 'arraybuffer',
      validateStatus: () => true,
    });
    if (imgRes.status < 200 || imgRes.status >= 300) {
      throw new Error(`Thumbnail fetch failed: ${imgRes.status}`);
    }
    const contentType = imgRes.headers['content-type'] || 'image/jpeg';
    const buffer = Buffer.from(imgRes.data as ArrayBuffer);

    // Cache 24h
    await this.cache.set(
      cacheKey,
      { contentType, buffer },
      24 * 60 * 60 * 1000,
    );

    return {
      contentType,
      stream: Readable.from(buffer),
    };
  }

  async getThumbnailUrl(fileId: string, sz: string = 's200') {
    const sizeParam = sz || 's200';
    // Optionally, we could validate accessibility via metadata using key rotation,
    // but return URL directly to avoid server load.
    const url = `https://drive.google.com/thumbnail?id=${fileId}&sz=${encodeURIComponent(
      sizeParam,
    )}`;
    return url;
  }
}
