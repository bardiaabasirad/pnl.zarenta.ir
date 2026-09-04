import { HttpInterceptorFn } from '@angular/common/http';
import { inject, Injector } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import {MatSnackBar} from '@angular/material/snack-bar';

export const authErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const injector = inject(Injector);
  const router = inject(Router);
  const matSnackBar = inject(MatSnackBar);

  return next(req).pipe(
    catchError((error) => {
      const isLoginRequest = req.url.includes('/login');

      if (error.status === 401 && !isLoginRequest) {
        const authService = injector.get(AuthService);
        authService.clearSession();
        matSnackBar.open('حساب کاربری شما غیر فعال است', '', {duration: 3000});
        router.navigate(['/login']);
      }

      return throwError(() => error);
    })
  );
};
