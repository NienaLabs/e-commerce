import { Platform } from 'react-native';
import { BASE_URL } from './auth';

/**
 * Uploads a local image file URI (or blob: URL on web) to the backend.
 * Returns the full public URL of the uploaded file.
 */
export async function uploadFile(fileUri: string, token: string): Promise<string> {
  const formData = new FormData();

  if (Platform.OS === 'web') {
    // On web, Expo image picker gives a blob: URL.
    // We need to fetch that blob, then append the actual Blob object to FormData.
    const blobRes = await fetch(fileUri);
    const blob = await blobRes.blob();

    // Infer extension from mime type
    const mimeType = blob.type || 'image/jpeg';
    const ext = mimeType.split('/')[1] || 'jpg';
    const filename = `upload.${ext}`;

    formData.append('file', blob, filename);
  } else {
    // On React Native, we use the { uri, name, type } object form
    const filename = fileUri.split('/').pop() || 'upload.jpg';
    const ext = filename.split('.').pop()?.toLowerCase() || 'jpg';
    const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';

    formData.append('file', {
      uri: fileUri,
      name: filename,
      type: mimeType,
    } as any);
  }

  const res = await fetch(`${BASE_URL}/upload/`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      // Do NOT manually set Content-Type for multipart/form-data —
      // fetch sets it automatically with the correct boundary.
    },
    body: formData,
  });

  if (!res.ok) {
    let detail = 'Failed to upload file';
    try {
      const errData = await res.json();
      detail = errData.detail || detail;
    } catch {}
    throw new Error(detail);
  }

  const data = await res.json();

  // data.url is a relative path like /media/abc123.jpg
  // Construct the full URL from the backend base URL
  const origin = new URL(BASE_URL).origin;
  return `${origin}${data.url}`;
}
