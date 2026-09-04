import {CanActivateFn, Router} from '@angular/router';
import {AuthFlowService} from '../services/auth-flow.service';
import {inject} from '@angular/core';

export const resetCredentialsGuard: CanActivateFn = () => {
  const flow = inject(AuthFlowService);
  const router = inject(Router);
  const state = flow.getState();

  if (!state?.reset_token) {
    router.navigate(['/auth/mobile']);
    return false;
  }
  return true;
};
