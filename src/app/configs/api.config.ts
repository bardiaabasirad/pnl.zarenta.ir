import { InjectionToken } from '@angular/core';
import {environment} from '../../environments/environment';

// Creates API_CONFIG token that can be used in a DI Provider
// used in src/app/modules/core/core.module.ts
export const API_CONFIG = new InjectionToken('api.config');

export const ApiConfig: any = {
  root: environment.apiUrl,
  api: `${environment.apiUrl}/api`,
};
