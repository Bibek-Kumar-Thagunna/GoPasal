import { isAxiosError } from 'axios';

export function extractApiErrorMessage(err: unknown, fallback: string): string {
  if (isAxiosError(err)) {
    const data = err.response?.data as
      | { error?: { message?: string }; message?: string }
      | undefined;
    return data?.error?.message ?? data?.message ?? err.message ?? fallback;
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}
