import { Router, UrlTree } from '@angular/router';
import { inject } from "@angular/core";
import { AuthService } from "../services/auth.service";
import { NavigationLoaderService } from "../services/navigation-loader.service";
import { from, Observable, of } from "rxjs";
import { map, catchError, finalize } from "rxjs/operators";

export const authGuard = (): Observable<boolean | UrlTree> | boolean | UrlTree => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const loader = inject(NavigationLoaderService);

  if (authService.isLoggedIn()) {
    // فعال کردن لودینگ قبل از ارسال درخواست به سرور
    loader.show();

    return from(authService.getUserInfo()).pipe(
      map(() => {
        const user = authService.getUser();
        if (user) {
          return true;
        } else {
          return router.parseUrl('/');
        }
      }),
      catchError(() => {
        // مدیریت خطا در صورت عدم دسترسی به سرور
        return of(router.parseUrl('/'));
      }),
      finalize(() => {
        // غیرفعال کردن لودینگ تحت هر شرایطی (موفقیت یا خطا)
        loader.hide();
      })
    );
  } else {
    authService.setReturnUrl(router.url);
    // انتقال کاربر به صفحه ورود
    return router.parseUrl('/auth/mobile');
  }
};
