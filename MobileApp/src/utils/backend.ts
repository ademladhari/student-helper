import { Platform } from 'react-native';
import { OCR_BACKEND_URL_ANDROID, OCR_BACKEND_URL_IOS } from '@env';

const DEFAULT_BACKEND_BASE_URLS =
  Platform.OS === 'android'
    ? ['http://192.168.1.23:5000', 'http://127.0.0.1:5000', 'http://localhost:5000', 'http://10.0.2.2:5000']
    : ['http://192.168.1.23:5000', 'http://localhost:5000', 'http://127.0.0.1:5000'];

export function getBackendBaseUrls() {
  const custom =
    Platform.OS === 'android' ? OCR_BACKEND_URL_ANDROID?.trim() : OCR_BACKEND_URL_IOS?.trim();
  if (custom) {
    return [custom, ...DEFAULT_BACKEND_BASE_URLS];
  }
  return DEFAULT_BACKEND_BASE_URLS;
}

export async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function readResponseBody(response: Response) {
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    return response.json();
  }

  return response.text();
}

export async function probeBackend() {
  const errors: string[] = [];
  const baseUrls = getBackendBaseUrls();

  for (const baseUrl of baseUrls) {
    const endpoint = `${baseUrl}/api/health`;

    try {
      const response = await fetchWithTimeout(endpoint, { method: 'GET' }, 5000);

      if (response.ok) {
        return baseUrl;
      }

      const body = await readResponseBody(response);
      errors.push(
        `${endpoint} -> ${response.status} (${typeof body === 'string' ? body : JSON.stringify(body)})`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown network error';
      errors.push(`${endpoint} -> ${message}`);
    }
  }

  throw new Error(`Unable to reach backend. Tried: ${errors.join(' | ')}`);
}
