/**
 * Uploading a picture, from the browser straight to Cloudinary.
 *
 * It never passes through our server, so there is no size limit of ours
 * to hit and nothing to pay for. The upload preset is unsigned, which is
 * why its name can live in the page: all it allows is adding pictures.
 *
 * A phone photograph can be 12 megabytes and 6000 pixels wide. Nothing on
 * the site is drawn wider than 2400, so it is shrunk here first. That makes
 * the upload several times faster on a slow connection and keeps it under
 * the free plan's 10 megabyte limit.
 */

const CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

const LONGEST_EDGE = 2400;
const LEAVE_ALONE_UNDER = 1.5 * 1024 * 1024;

export type Uploaded = { url: string; width: number; height: number; bytes: number; mime: string };

export function uploadsReady(): boolean {
  return Boolean(CLOUD && PRESET);
}

async function shrink(file: File): Promise<Blob> {
  if (!/^image\/(jpeg|png|webp|heic|heif|avif)$/.test(file.type)) return file;

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    return file; // a format this browser cannot open: Cloudinary will cope
  }

  const scale = Math.min(1, LONGEST_EDGE / Math.max(bitmap.width, bitmap.height));
  if (scale === 1 && file.size < LEAVE_ALONE_UNDER) {
    bitmap.close();
    return file;
  }

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  // PNGs may be drawings with transparency, so they stay PNG
  const type = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
  const blob = await new Promise<Blob | null>((done) => canvas.toBlob(done, type, 0.9));
  return blob && blob.size < file.size ? blob : file;
}

export async function uploadImage(file: File, onProgress?: (fraction: number) => void): Promise<Uploaded> {
  if (!CLOUD || !PRESET) {
    throw new Error('Picture uploads are not switched on yet. The Cloudinary details are missing from Vercel.');
  }
  if (!file.type.startsWith('image/')) throw new Error(`${file.name} is not a picture.`);

  const body = new FormData();
  body.append('file', await shrink(file), file.name);
  body.append('upload_preset', PRESET);

  // XMLHttpRequest rather than fetch, because only it reports upload progress
  const result = await new Promise<Record<string, unknown>>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUD}/image/upload`);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(e.loaded / e.total);
    xhr.onload = () => {
      let json: Record<string, unknown> = {};
      try {
        json = JSON.parse(xhr.responseText);
      } catch {}
      if (xhr.status >= 200 && xhr.status < 300) resolve(json);
      else {
        const message = (json.error as { message?: string } | undefined)?.message;
        reject(new Error(message ? `Cloudinary said: ${message}` : `The upload failed (${xhr.status}).`));
      }
    };
    xhr.onerror = () => reject(new Error('The upload failed. Check the connection and try again.'));
    xhr.send(body);
  });

  return {
    url: String(result.secure_url),
    width: Number(result.width),
    height: Number(result.height),
    bytes: Number(result.bytes),
    mime: `image/${String(result.format ?? 'jpeg')}`
  };
}
