import { Platform } from 'react-native';
import { isAxiosError } from 'axios';
import apiClient from '../services/api';
import { storage } from './storage';
import { extractApiErrorMessage } from './api-error';

type UploadKycOptions = {
  registrationPhone?: string;
  registrationToken?: string | null;
  /** Present on web when picking files via expo-document-picker / image-picker. */
  webFile?: File;
};

async function appendFileToForm(
  form: FormData,
  uri: string,
  fileName: string,
  mimeType: string,
  webFile?: File
): Promise<void> {
  if (webFile instanceof File) {
    form.append('file', webFile, fileName);
    return;
  }

  if (Platform.OS === 'web') {
    const response = await fetch(uri);
    const blob = await response.blob();
    const type = mimeType || blob.type || 'application/octet-stream';
    form.append('file', new File([blob], fileName, { type }));
    return;
  }

  form.append(
    'file',
    {
      uri,
      name: fileName,
      type: mimeType,
    } as unknown as Blob
  );
}

export async function uploadKycFileFromUri(
  uri: string,
  fileName: string,
  mimeType: string,
  options?: UploadKycOptions
): Promise<string> {
  const form = new FormData();
  await appendFileToForm(form, uri, fileName, mimeType, options?.webFile);

  const phone = options?.registrationPhone?.trim();
  const registrationToken =
    options?.registrationToken?.trim() ||
    (await storage.getItemAsync('registrationToken'));
  const accessToken = await storage.getItemAsync('accessToken');

  let path: string;
  if (accessToken) {
    path = '/seller/media/kyc-upload';
  } else if (registrationToken) {
    form.append('registrationToken', registrationToken);
    path = '/seller/auth/register/kyc-upload';
  } else if (phone) {
    form.append('phone', phone);
    path = '/seller/auth/register/kyc-upload';
  } else {
    throw new Error(
      'Complete phone OTP on the register screen first, or sign in to upload documents.'
    );
  }

  try {
    if (Platform.OS === 'web') {
      const baseUrl = apiClient.defaults.baseURL || 'http://localhost:3000/api/v1';
      const fullUrl = `${baseUrl}${path}`;
      const headers: Record<string, string> = {};
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }
      const fetchRes = await fetch(fullUrl, {
        method: 'POST',
        headers,
        body: form,
      });
      if (!fetchRes.ok) {
        const errorData = await fetchRes.json().catch(() => ({}));
        const message = errorData?.error?.message || errorData?.message || `Upload failed (${fetchRes.status})`;
        throw new Error(message);
      }
      const data = await fetchRes.json();
      const url = data?.data?.url || data?.url;
      if (!url) throw new Error('Upload did not return a URL');
      return url;
    }

    const res = await apiClient.post<{ data: { url: string } }>(path, form);
    const url = res.data?.data?.url;
    if (!url) throw new Error('Upload did not return a URL');
    return url;
  } catch (err) {
    throw new Error(
      extractApiErrorMessage(
        err,
        isAxiosError(err) && err.response?.status === 422
          ? 'Upload rejected. Use PDF or JPG/PNG under 10MB, and ensure your registration OTP is still valid.'
          : 'Upload failed'
      )
    );
  }
}
