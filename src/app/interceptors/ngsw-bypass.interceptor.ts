import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../environments/environment';

/** Prevent Angular SW from intercepting/caching API traffic. */
export const ngswBypassInterceptor: HttpInterceptorFn = (req, next) => {
  const isApiRequest =
    req.url.startsWith(environment.apiUrl) ||
    req.url.includes(`://${environment.domain}`) ||
    req.url.includes(`://api.${environment.domain}`);

  if (!isApiRequest || req.headers.has('ngsw-bypass')) {
    return next(req);
  }

  return next(
    req.clone({
      setHeaders: {
        'ngsw-bypass': 'true',
      },
    })
  );
};
