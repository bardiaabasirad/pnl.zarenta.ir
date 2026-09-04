import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const geoBlockInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  return next(req).pipe(
    catchError((error) => {
      const isPing = req.url.includes('/api/ping');

      if (
        !isPing &&
        error.status === 403 &&
        error.error?.code === 'GEO_BLOCKED' &&
        router.url !== '/blocked'
      ) {
        router.navigate(['/blocked']);
      }

      return throwError(() => error);
    })
  );
};
