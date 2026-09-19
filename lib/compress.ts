/**
 * Making a big picture smaller before it is uploaded, without it looking
 * any different on the site. Runs in the browser.
 *
 * She picks how much smaller: 25, 50 or 75 percent. Pictures under 1 MB are
 * never touched. For the rest it works like a careful person would:
 *
 * 1. Keep every pixel and lower the encoding quality a step at a time, in
 *    WebP where the browser can write it, since WebP holds far more detail
 *    per byte than JPEG. Stop at the first step that reaches the target.
 * 2. Quality never goes below a floor where compression starts to show.
 *    If the target still is not reached, reduce the pixel size instead,
 *    but never below 2000 pixels on the long side, which is still larger
 *    than anything on the site is drawn.
 * 3. If even that cannot reach the target, keep the smallest good result
 *    and say honestly how much was saved. Never make it worse to hit a number.
 * 4. If the result is not actually smaller, the original is uploaded.
 *
 * Transparent PNG drawings stay transparent.
 */

export type Reduction = 0 | 25 | 50 | 75;

export const REDUCTIONS: Reduction[] = [0, 25, 50, 75];
export const LEAVE_UNDER = 1024 * 1024;
/** Cloudinary's free plan refuses anything larger than 10 MB. */
const HARD_LIMIT = 9.5 * 1024 * 1024;
const QUALITY_STEPS = [0.96, 0.92, 0.88, 0.84, 0.8, 0.76, 0.72];
const MIN_LONG_EDGE = 2000;
const MAX_LONG_EDGE = 4000;

export type Prepared = { blob: Blob; before: number; after: number; note: string | null };

let webp: boolean | null = null;
async function canWriteWebp(): Promise<boolean> {
  if (webp !== null) return webp;
  const c = document.createElement('canvas');
  c.width = c.height = 2;
  const blob = await new Promise<Blob | null>((done) => c.toBlob(done, 'image/webp', 0.8));
  webp = blob?.type === 'image/webp';
  return webp;
}

/** Downscaling in halves keeps fine lines, like lattice and brick joints, crisp. */
function draw(bitmap: ImageBitmap, width: number, height: number): HTMLCanvasElement {
  let source: CanvasImageSource = bitmap;
  let w = bitmap.width;
  let h = bitmap.height;

  while (w / 2 >= width) {
    const step = document.createElement('canvas');
    step.width = Math.round(w / 2);
    step.height = Math.round(h / 2);
    const ctx = step.getContext('2d')!;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(source, 0, 0, step.width, step.height);
    source = step;
    w = step.width;
    h = step.height;
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source, 0, 0, width, height);
  return canvas;
}

const encode = (canvas: HTMLCanvasElement, type: string, quality: number) =>
  new Promise<Blob | null>((done) => canvas.toBlob(done, type, quality));

export function formatBytes(bytes: number): string {
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export async function prepare(file: File, reduction: Reduction): Promise<Prepared> {
  const before = file.size;
  const untouched: Prepared = { blob: file, before, after: before, note: null };

  // small pictures, and big ones she chose to keep as they are, go up untouched unless Cloudinary would refuse them
  const wanted = before < LEAVE_UNDER ? 0 : reduction;
  if (wanted === 0 && before <= HARD_LIMIT) return untouched;

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    return untouched; // a format this browser cannot open, such as HEIC: Cloudinary converts it
  }

  const target = Math.min(wanted ? before * (1 - wanted / 100) : HARD_LIMIT, HARD_LIMIT);
  const transparent = file.type === 'image/png';
  const type = (await canWriteWebp()) ? 'image/webp' : transparent ? 'image/png' : 'image/jpeg';

  const longEdge = Math.max(bitmap.width, bitmap.height);
  let scale = Math.min(1, MAX_LONG_EDGE / longEdge);
  let best: Blob | null = null;

  for (let round = 0; round < 4; round++) {
    const canvas = draw(bitmap, Math.round(bitmap.width * scale), Math.round(bitmap.height * scale));
    const steps = type === 'image/png' ? [1] : QUALITY_STEPS;

    for (const quality of steps) {
      const blob = await encode(canvas, type, quality);
      if (!blob) continue;
      if (!best || blob.size < best.size) best = blob;
      if (blob.size <= target) break;
    }
    if (best && best.size <= target) break;

    // quality is at its floor: shrink the pixels just enough, but not past the minimum
    const edge = Math.max(bitmap.width, bitmap.height) * scale;
    if (edge <= MIN_LONG_EDGE) break;
    const next = Math.max(MIN_LONG_EDGE / Math.max(bitmap.width, bitmap.height), scale * Math.sqrt(target / (best?.size ?? before)) * 0.97);
    if (next >= scale) break;
    scale = next;
  }
  bitmap.close();

  if (!best || best.size >= before) return untouched;

  const saved = Math.round((1 - best.size / before) * 100);
  const short = wanted && saved < wanted - 3 ? ` (${wanted}% would have cost visible quality, so it stopped there)` : '';
  return {
    blob: best,
    before,
    after: best.size,
    note: `${formatBytes(before)} to ${formatBytes(best.size)}, ${saved}% smaller${short}`
  };
}
