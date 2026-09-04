import {StorageKey, StorageService} from '../services/storage.service';
import {HttpInterceptorFn} from '@angular/common/http';
import {environment} from '../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const allowedOrigins = [
    `http://${environment.domain}`,
    `https://${environment.domain}`,
    environment.apiUrl,
  ];

  const isAllowedOrigin = allowedOrigins.some((origin) =>
    req.url.startsWith(origin)
  );

  if (!isAllowedOrigin || req.headers.has('Authorization')) {
    return next(req);
  }

  const authToken = StorageService.getCookie(StorageKey.ACCESS_TOKEN);

  if (!authToken) {
    return next(req);
  }

  return next(
    req.clone({
      headers: req.headers.set('Authorization', `Bearer ${authToken}`),
    })
  );
};
