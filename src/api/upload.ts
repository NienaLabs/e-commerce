import { Platform, Image as RNImage } from 'react-native';
// auth.ts only aliases this import locally, so it can't be re-exported from
// there. Take it from the shared helper that owns it.
import { API_BASE_URL as BASE_URL } from './client';
import * as ImageManipulator from 'expo-image-manipulator';
import { THUMB_SUFFIX } from '../utils/imageUrl';

/**
 * How large an image needs to be, by what it's for.
 *
 * Sized at roughly 2–3× the largest box each image is ever drawn in, so it
 * stays sharp on high-DPI screens without shipping pixels nobody can see.
 * Everything used to be forced to 1080px wide regardless of purpose — a store
 * logo rendered in a 96px circle was being stored at 1080×1926.
 */
export const UPLOAD_PRESETS = {
  /** Store logo / avatar — rendered at 96px at the largest. */
  logo: { maxWidth: 320, quality: 0.82 },
  /** Storefront banner — full width, but short. */
  banner: { maxWidth: 1440, quality: 0.8 },
  /** Product photography — opened full screen on the product page. */
  product: { maxWidth: 1080, quality: 0.8 },
} as const;

export type UploadPreset = keyof typeof UPLOAD_PRESETS;

/** Natural size of a local image, so we never upscale a small one. */
async function getImageSize(uri: string): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    RNImage.getSize(
      uri,
      (width, height) => resolve({ width, height }),
      () => resolve(null),
    );
  });
}

/**
 * Uploads a local image file URI to S3 via presigned URL with client-side compression.
 * Returns the full public URL of the uploaded file.
 */
export async function uploadFile(
  fileUri: string,
  token: string,
  preset: UploadPreset = 'product',
): Promise<string> {
  const { maxWidth, quality } = UPLOAD_PRESETS[preset] ?? UPLOAD_PRESETS.product;

  // 1. Compress. Only ever scale DOWN — resizing to a fixed width also
  // upscales anything smaller, which inflates the file for no added detail.
  const size = await getImageSize(fileUri);
  const targetWidth = size ? Math.min(size.width, maxWidth) : maxWidth;

  const manipResult = await ImageManipulator.manipulateAsync(
    fileUri,
    // ImageManipulator keeps the aspect ratio when only width is given.
    size && size.width <= maxWidth ? [] : [{ resize: { width: targetWidth } }],
    { compress: quality, format: ImageManipulator.SaveFormat.JPEG },
  );

  const finalUri = manipResult.uri;
  
  // Extract filename and mime
  const filename = finalUri.split('/').pop() || 'upload.jpg';
  const mimeType = 'image/jpeg';
  
  let blob: Blob;
  if (Platform.OS === 'web') {
    const blobRes = await fetch(finalUri);
    blob = await blobRes.blob();
  } else {
    // For React Native fetch with multipart/form-data or direct put
    // Since we're using presigned POST, we need FormData
  }

  // 2. Request Presigned URL
  const presignRes = await fetch(`${BASE_URL}/upload/presigned`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ filename, content_type: mimeType }),
  });

  if (!presignRes.ok) {
    let detail = 'Failed to get upload URL';
    try {
      const errData = await presignRes.json();
      detail = errData.detail || detail;
    } catch {}
    throw new Error(detail);
  }

  const { presigned, url: publicUrl } = await presignRes.json();

  // 3. Upload to S3 using Presigned POST
  const formData = new FormData();
  // Append all fields required by AWS exactly as returned
  Object.keys(presigned.fields).forEach((key) => {
    formData.append(key, presigned.fields[key]);
  });

  if (Platform.OS === 'web') {
    formData.append('file', blob!, filename);
  } else {
    formData.append('file', {
      uri: finalUri,
      name: filename,
      type: mimeType,
    } as any);
  }

  const uploadRes = await fetch(presigned.url, {
    method: 'POST',
    body: formData,
  });

  if (!uploadRes.ok) {
    throw new Error('Failed to upload file to storage');
  }

  // 4. Write a small rendition next to the original.
  //
  // Lists (product grids, shelves, search results) draw images at ~250px but
  // would otherwise download the full-size file — the single biggest reason
  // browsing feels slow once a catalogue has real photos. sizedImageUrl()
  // points those lists at this file; the product page still loads the full
  // one. Best-effort: if it fails the original is already safely stored, and
  // sizedImageUrl falls back to it.
  try {
    await uploadThumbnail(fileUri, publicUrl, token);
  } catch (e) {
    console.warn('[upload] thumbnail generation skipped:', (e as Error)?.message);
  }

  // Handle localstack quirk where S3 backend returns 204 but `url` is what we need
  return publicUrl;
}


/** Width of the small rendition used by lists and grids. */
const THUMB_WIDTH = 400;

/**
 * Build and upload a `<key>_thumb.jpg` beside an already-uploaded image.
 * Keyed off the original's public URL so the two always stay in step.
 */
async function uploadThumbnail(sourceUri: string, publicUrl: string, token: string): Promise<void> {
  const dot = publicUrl.lastIndexOf('.');
  if (dot < 0) return;
  const originalKey = publicUrl.slice(publicUrl.lastIndexOf('/') + 1);
  const thumbFilename = `${originalKey.slice(0, originalKey.lastIndexOf('.'))}${THUMB_SUFFIX}.jpg`;

  const thumb = await ImageManipulator.manipulateAsync(
    sourceUri,
    [{ resize: { width: THUMB_WIDTH } }],
    { compress: 0.72, format: ImageManipulator.SaveFormat.JPEG },
  );

  const presignRes = await fetch(`${BASE_URL}/upload/presigned`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ filename: thumbFilename, content_type: 'image/jpeg' }),
  });
  if (!presignRes.ok) throw new Error('Could not presign thumbnail');
  const { presigned } = await presignRes.json();

  // The server assigns its own random key, so force ours: the app derives the
  // thumbnail URL from the original's name and must be able to find it.
  const fields = { ...presigned.fields, key: thumbFilename };

  const formData = new FormData();
  Object.keys(fields).forEach((k) => formData.append(k, fields[k]));

  if (Platform.OS === 'web') {
    const blobRes = await fetch(thumb.uri);
    formData.append('file', await blobRes.blob(), thumbFilename);
  } else {
    formData.append('file', { uri: thumb.uri, name: thumbFilename, type: 'image/jpeg' } as any);
  }

  const res = await fetch(presigned.url, { method: 'POST', body: formData });
  if (!res.ok) throw new Error('Thumbnail upload rejected');
}
