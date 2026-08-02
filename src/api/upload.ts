import { Platform } from 'react-native';
import { BASE_URL } from './auth';
import * as ImageManipulator from 'expo-image-manipulator';

/**
 * Uploads a local image file URI to S3 via presigned URL with client-side compression.
 * Returns the full public URL of the uploaded file.
 */
export async function uploadFile(fileUri: string, token: string): Promise<string> {
  // 1. Compress Image
  // Scale down to max width 1080px (if larger) and compress JPEG to 80%
  const manipResult = await ImageManipulator.manipulateAsync(
    fileUri,
    [{ resize: { width: 1080 } }], // ImageManipulator respects aspect ratio if height isn't provided
    { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
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

  // Handle localstack quirk where S3 backend returns 204 but `url` is what we need
  return publicUrl;
}
