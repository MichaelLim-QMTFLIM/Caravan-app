import { Capacitor } from '@capacitor/core';
import { environment } from '../../environments/environment';

/** Resolve API routes for the browser proxy or a native Android backend. */
export function apiEndpoint(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const baseUrl = Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android'
    ? environment.androidApiBaseUrl
    : environment.browserApiBaseUrl;

  return baseUrl ? `${baseUrl.replace(/\/$/, '')}${normalizedPath}` : normalizedPath;
}
