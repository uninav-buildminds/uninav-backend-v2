/**
 * Batch Preview Generator Script
 *
 * Generates preview images for PDF and GDrive materials using pdf2pic (gs/gm).
 * Uploads previews to Cloudinary via the existing /materials/preview/upload/:id endpoint.
 *
 * Usage:
 *   pnpm tsx src/scripts/batch-preview.ts [options]
 *
 * Options:
 *   --replace          Replace existing previews (default: skip materials that already have one)
 *   --type=pdf|gdrive  Filter by material type (default: both)
 *   --creator=<uuid>   Filter by creator ID
 *   --course=<uuid>    Filter by course ID
 *   --throttle=<n>     Delay in ms between items (default: 500)
 *   --start-page=<n>   Resume from page N (default: 1)
 *   --limit=<n>        Page size (default: 50)
 *   --dry-run          Fetch and log only, no uploads
 */

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import axios from 'axios';
import FormData from 'form-data';
import { fromBuffer } from 'pdf2pic';
import * as dotenv from 'dotenv';

// ── Env ─────────────────────────────────────────────────────────────────────

dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const API_BASE = process.env.SCRIPT_API_BASE ?? 'http://localhost:3200';
const ROOT_API_KEY = process.env.ROOT_API_KEY;

if (!ROOT_API_KEY) {
  console.error('ROOT_API_KEY is not set in .env / .env.local');
  process.exit(1);
}

// ── Args ─────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const flag = (name: string) => args.includes(`--${name}`);
const opt = (name: string, fallback?: string): string | undefined =>
  args.find((a) => a.startsWith(`--${name}=`))?.split('=')[1] ?? fallback;

const REPLACE_EXISTING  = flag('replace');
const DRY_RUN           = flag('dry-run');
const TYPE_FILTER       = opt('type');           // 'pdf' | 'gdrive' | undefined
const CREATOR_FILTER    = opt('creator');
const COURSE_FILTER     = opt('course');
const DELAY_MS          = parseInt(opt('throttle', '500')!, 10); // ms between items
const START_PAGE        = parseInt(opt('start-page', '1')!, 10);
const PAGE_LIMIT        = parseInt(opt('limit', '50')!, 10);

// ── HTTP client ───────────────────────────────────────────────────────────────

const http = axios.create({
  baseURL: API_BASE,
  headers: { 'X-Root-API-Key': ROOT_API_KEY },
  timeout: 60_000,
});

// ── Types ─────────────────────────────────────────────────────────────────────

interface Material {
  id: string;
  label: string;
  type: 'pdf' | 'gdrive';
  previewUrl?: string | null;
}

interface PagedResponse {
  status: string;
  data: {
    items: Material[];
    pagination: { total: number; totalPages: number; page: number };
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

let processed = 0, successful = 0, failed = 0, skipped = 0, rateLimitPauses = 0;

function log(msg: string) {
  const ts = new Date().toISOString().slice(11, 19);
  console.log(`[${ts}] ${msg}`);
}

function stats() {
  log(`Stats — processed: ${processed} | ok: ${successful} | failed: ${failed} | skipped: ${skipped} | rate-limit pauses: ${rateLimitPauses}`);
}

// ── PDF preview via pdf2pic ───────────────────────────────────────────────────

async function generatePdfPreview(source: string | Buffer): Promise<Buffer | null> {
  // Fetch PDF bytes if a URL was passed
  let pdfBuffer: Buffer;
  if (typeof source === 'string') {
    try {
      const res = await axios.get<ArrayBuffer>(source, {
        responseType: 'arraybuffer',
        timeout: 60_000,
      });
      pdfBuffer = Buffer.from(res.data);
    } catch (err: any) {
      throw new Error(`Failed to download PDF: ${err.message}`);
    }
  } else {
    pdfBuffer = source;
  }

  const tmpDir  = os.tmpdir();
  const tmpFile = path.join(tmpDir, `uninav_preview_${Date.now()}.pdf`);
  fs.writeFileSync(tmpFile, pdfBuffer);

  log(`  Converting PDF (${Math.round(pdfBuffer.length / 1024)}KB) → JPG via pdf2pic…`);

  try {
    const convert = fromBuffer(pdfBuffer, {
      density: 72,
      format: 'jpg',
      width: 800,
      height: 1131,
      quality: 60,
      saveFilename: 'page',
      savePath: tmpDir,
    });

    const result = await convert(1, { responseType: 'buffer' });

    if (!result?.buffer) {
      log('  pdf2pic returned no buffer');
      return null;
    }

    const buf = result.buffer as Buffer;
    const previewPath = path.join(tmpDir, `preview_inspect_${Date.now()}.jpg`);
    fs.writeFileSync(previewPath, buf);
    log(`  Conversion done (${Math.round(buf.length / 1024)}KB) — inspect: ${previewPath}`);
    return buf;
  } finally {
    try { fs.unlinkSync(tmpFile); } catch {}
  }
}

// ── GDrive preview via direct download (no API key) ──────────────────────────

async function generateGDrivePreview(materialId: string): Promise<Buffer | null> {
  // Fetch full material to get resourceAddress (GDrive URL)
  const res = await http.get(`/materials/${materialId}`);
  const address: string | undefined = res.data?.data?.resource?.resourceAddress;
  if (!address) return null;

  const fileId = extractGDriveFileId(address);
  if (!fileId) return null;

  // Direct download URL — works for publicly shared files, no API key needed
  const downloadUrl = `https://drive.google.com/uc?id=${fileId}&export=download`;

  log(`  Downloading from GDrive (id: ${fileId})…`);

  let fileBuffer: Buffer;
  try {
    const dlRes = await axios.get<ArrayBuffer>(downloadUrl, {
      responseType: 'arraybuffer',
      timeout: 60_000,
      maxRedirects: 5,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; uninav-preview-bot/1.0)',
      },
    });

    const contentType = String(dlRes.headers['content-type'] ?? '');
    if (contentType.includes('text/html')) {
      log('  GDrive returned confirmation page (file too large or not public) — skipping');
      return null;
    }

    fileBuffer = Buffer.from(dlRes.data);
    log(`  Downloaded ${Math.round(fileBuffer.length / 1024)}KB`);
  } catch (err: any) {
    throw new Error(`GDrive download failed: ${err.message}`);
  }

  const isPdf =
    address.toLowerCase().includes('.pdf') ||
    fileBuffer.slice(0, 4).toString('ascii') === '%PDF';

  if (!isPdf) {
    log('  Not a PDF — skipping');
    return null;
  }

  return generatePdfPreview(fileBuffer);
}

function extractGDriveFileId(url: string): string | null {
  const patterns = [
    /\/folders\/([a-zA-Z0-9_-]+)/,
    /\/file\/d\/([a-zA-Z0-9_-]+)/,
    /\/document\/d\/([a-zA-Z0-9_-]+)/,
    /\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/,
    /\/presentation\/d\/([a-zA-Z0-9_-]+)/,
    /[?&]id=([a-zA-Z0-9_-]+)/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

// ── Upload preview ────────────────────────────────────────────────────────────

async function uploadPreview(materialId: string, imageBuffer: Buffer): Promise<void> {
  const form = new FormData();
  form.append('preview', imageBuffer, {
    filename: 'preview.jpg',
    contentType: 'image/jpeg',
  });

  await http.post(`/materials/preview/upload/${materialId}`, form, {
    headers: {
      'X-Root-API-Key': ROOT_API_KEY,
      ...form.getHeaders(),
    },
    timeout: 120_000, // Cloudinary uploads can be slow
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
  });
}

// ── URL patterns that should never be replaced ───────────────────────────────
// Add any hostname/pattern here to protect those previews from being overwritten.
const SKIP_REPLACE_PATTERNS = [
  'res.cloudinary.com',
];

function isProtectedUrl(url: string): boolean {
  return SKIP_REPLACE_PATTERNS.some((p) => url.includes(p));
}

// ── Process one material ──────────────────────────────────────────────────────

async function processMaterial(material: Material): Promise<void> {
  if (material.previewUrl && isProtectedUrl(material.previewUrl)) {
    skipped++;
    processed++;
    return;
  }

  if (!REPLACE_EXISTING && material.previewUrl) {
    skipped++;
    processed++;
    return;
  }

  log(`Processing [${material.type}] ${material.label}`);

  let imageBuffer: Buffer | null = null;
  let hitRateLimit = false;

  try {
    if (material.type === 'pdf') {
      const dlRes = await http.get(`/materials/download/${material.id}`);
      const pdfUrl: string = dlRes.data?.data?.url;
      if (!pdfUrl) throw new Error('No download URL returned');
      imageBuffer = await generatePdfPreview(pdfUrl);
    } else {
      imageBuffer = await generateGDrivePreview(material.id);
    }
  } catch (err: any) {
    const msg = String(err?.message ?? err).toLowerCase();
    if (msg.includes('rate limit') || msg.includes('429') || msg.includes('403')) {
      hitRateLimit = true;
    } else {
      log(`  Failed: ${err?.message}`);
      failed++;
      processed++;
      return;
    }
  }

  // Rate-limit pause with countdown
  if (hitRateLimit) {
    rateLimitPauses++;
    for (let s = 60; s > 0; s--) {
      process.stdout.write(`\r  Rate limited — resuming in ${s}s… `);
      await sleep(1_000);
    }
    process.stdout.write('\n');

    try {
      if (material.type === 'pdf') {
        const dlRes = await http.get(`/materials/download/${material.id}`);
        const pdfUrl: string = dlRes.data?.data?.url;
        if (!pdfUrl) throw new Error('No download URL returned');
        imageBuffer = await generatePdfPreview(pdfUrl);
      } else {
        imageBuffer = await generateGDrivePreview(material.id);
      }
    } catch (err: any) {
      log(`  Retry failed: ${err?.message}`);
      failed++;
      processed++;
      return;
    }
  }

  if (!imageBuffer || imageBuffer.length === 0) {
    log(`  No preview source available — skipping`);
    skipped++;
    processed++;
    return;
  }

  if (DRY_RUN) {
    log(`  [dry-run] Would upload ${imageBuffer.length} bytes`);
    successful++;
    processed++;
    return;
  }

  try {
    await uploadPreview(material.id, imageBuffer);
    log(`  Uploaded (${Math.round(imageBuffer.length / 1024)}KB)`);
    successful++;
  } catch (err: any) {
    log(`  Upload failed: ${err?.message}`);
    failed++;
  }

  processed++;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  log('=== Batch Preview Generator ===');
  log(`API: ${API_BASE} | delay: ${DELAY_MS}ms between items | replace: ${REPLACE_EXISTING} | dry-run: ${DRY_RUN}`);
  if (TYPE_FILTER)   log(`Filter type: ${TYPE_FILTER}`);
  if (CREATOR_FILTER) log(`Filter creator: ${CREATOR_FILTER}`);
  if (COURSE_FILTER)  log(`Filter course: ${COURSE_FILTER}`);

  // Build query params
  const baseParams: Record<string, string> = {
    limit: String(PAGE_LIMIT),
    ignorePreference: 'true',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  };
  if (TYPE_FILTER)    baseParams.type       = TYPE_FILTER.toLowerCase();
  if (CREATOR_FILTER) baseParams.creatorId  = CREATOR_FILTER;
  if (COURSE_FILTER)  baseParams.courseId   = COURSE_FILTER;

  // Fetch first page to get total
  const firstRes = await http.get<PagedResponse>('/materials', { params: { ...baseParams, page: START_PAGE } });
  if (firstRes.data.status !== 'success') {
    log('Failed to fetch materials');
    process.exit(1);
  }

  const { total, totalPages } = firstRes.data.data.pagination;
  log(`Found ${total} materials across ${totalPages} pages (starting from page ${START_PAGE})`);

  for (let page = START_PAGE; page <= totalPages; page++) {
    log(`\n--- Page ${page} / ${totalPages} ---`);

    const pageRes = page === START_PAGE
      ? firstRes
      : await http.get<PagedResponse>('/materials', { params: { ...baseParams, page } });

    if (pageRes.data.status !== 'success') {
      log(`Failed to fetch page ${page}, skipping`);
      continue;
    }

    const eligible = pageRes.data.data.items.filter(
      (m) => m.type === 'pdf' || m.type === 'gdrive',
    );

    for (const material of eligible) {
      await processMaterial(material);
      await sleep(DELAY_MS);
    }

    stats();
  }

  log('\n=== Done ===');
  stats();
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
