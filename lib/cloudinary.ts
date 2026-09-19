/**
 * Uploading a picture, from the browser straight to Cloudinary.
 *
 * It never passes through our server, so there is no size limit of ours
 * to hit and nothing to pay for. The upload preset is unsigned, which is
 * why its name can live in the page: all it allows is adding pictures.
 *
 * Shrinking before upload happens in compress.ts, where she chooses how much.
 */

const CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

export type Uploaded = { url: string; width: number; height: number; bytes: number; mime: string };

export function uploadsReady(): boolean {
  return Boolean(CLOUD && PRESET);
}

export async function uploadImage(
  file: Blob,
  name: string,
  onProgress?: (fraction: number) => void
): Promise<Uploaded> {
  if (!CLOUD || !PRESET) {
    throw new Error('Picture uploads are not switched on yet. The Cloudinary details are missing from Vercel.');
  }
  // Windows often reports iPhone HEIC photos with no type at all: let the name decide then
  const picture = file.type ? file.type.startsWith('image/') : /\.(heic|heif|jpe?g|png|webp|avif|gif|tiff?)$/i.test(name);
  if (!picture) throw new Error(`${name} is not a picture.`);

  const body = new FormData();
  body.append('file', file, name);
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
