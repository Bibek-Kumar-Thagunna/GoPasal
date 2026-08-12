import { Platform } from 'react-native';
import apiClient from './api';

async function appendImageFile(
  formData: FormData,
  uri: string,
  fileName: string,
  mimeType: string,
  webFile?: File
): Promise<void> {
  if (webFile instanceof File) {
    formData.append('file', webFile, fileName);
    return;
  }
  if (Platform.OS === 'web') {
    const response = await fetch(uri);
    const blob = await response.blob();
    const type = mimeType || blob.type || 'image/jpeg';
    formData.append('file', new File([blob], fileName, { type }));
    return;
  }
  formData.append('file', { uri, name: fileName, type: mimeType } as unknown as Blob);
}

export async function uploadSellerProductImage(
  uri: string,
  fileName: string,
  mimeType: string,
  webFile?: File
): Promise<string> {
  const formData = new FormData();
  await appendImageFile(formData, uri, fileName, mimeType, webFile);
  const response = await apiClient.post('/seller/media/upload', formData);
  const url = response.data?.data?.url as string | undefined;
  if (!url) {
    throw new Error('Upload did not return a URL');
  }
  return url;
}
