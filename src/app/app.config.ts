import {
  ApplicationConfig,
  ErrorHandler,
  inject,
  isDevMode,
  provideAppInitializer,
} from '@angular/core';
import {provideRouter, withInMemoryScrolling} from '@angular/router';
import { routes } from './app.routes';
import {provideHttpClient, withInterceptors, withXhr} from '@angular/common/http';
import {authInterceptor} from './interceptors/auth.interceptor';
import {authErrorInterceptor} from './interceptors/auth-error.interceptor';
import {ngswBypassInterceptor} from './interceptors/ngsw-bypass.interceptor';
import {ViewportScroller} from '@angular/common';
import {provideServiceWorker} from '@angular/service-worker';
import {AppUpdateService} from './services/app-update.service';
import {PwaInstallService} from './services/pwa-install.service';
import {ChunkLoadErrorHandler} from './handlers/chunk-load-error.handler';

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
        ngswBypassInterceptor,
        authInterceptor,
        authErrorInterceptor
      ])
    ),

    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),

    { provide: ErrorHandler, useClass: ChunkLoadErrorHandler },

    provideAppInitializer(() => {
      const viewportScroller = inject(ViewportScroller);
      viewportScroller.setOffset([0, 120]);

      inject(PwaInstallService);
      const appUpdate = inject(AppUpdateService);
      appUpdate.start();
    })
  ]
};
