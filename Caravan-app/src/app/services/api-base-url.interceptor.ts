import { HttpInterceptorFn } from '@angular/common/http';
import { Capacitor } from '@capacitor/core';
import { apiEndpoint } from './api-endpoint';

export const apiBaseUrlInterceptor: HttpInterceptorFn = (request, next) => {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android' || /^https?:\/\//i.test(request.url)) {
    return next(request);
  }

  const url = apiEndpoint(request.url);
  return next(request.clone({ url, withCredentials: true }));
};
