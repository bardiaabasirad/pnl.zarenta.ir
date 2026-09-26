import {ApplicationConfig, inject, provideAppInitializer} from '@angular/core';
import {provideRouter, withInMemoryScrolling} from '@angular/router';
import { routes } from './app.routes';
import {provideHttpClient, withInterceptors, withXhr} from '@angular/common/http';
import {authInterceptor} from './interceptors/auth.interceptor';
import {authErrorInterceptor} from './interceptors/auth-error.interceptor';
import {ViewportScroller} from '@angular/common';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      routes,
      withInMemoryScrolling({
        anchorScrolling: 'enabled',
        scrollPositionRestoration: 'enabled',
      })
    ),

    provideHttpClient(
      withXhr(),
      withInterceptors([
        authInterceptor,
        authErrorInterceptor
      ])
    ),

    provideAppInitializer(() => {
      const viewportScroller = inject(ViewportScroller);
      viewportScroller.setOffset([0, 120]);
    })
  ]
};
