import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { map, catchError, of } from 'rxjs';
import {environment} from "../../environments/environment";

export const geoBlockGuard: CanActivateFn = () => {
  const http = inject(HttpClient);
  const router = inject(Router);

  return http.get(`${environment.apiUrl}/api/ping`).pipe(
    map(() => router.createUrlTree(['/'])),
    catchError((err) =>
      of(err.status === 403 && err.error?.code === 'GEO_BLOCKED'
        ? true
        : router.createUrlTree(['/']))
    )
  );
};
