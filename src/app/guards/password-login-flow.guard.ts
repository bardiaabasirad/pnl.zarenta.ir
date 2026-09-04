import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import {AuthFlowService} from '../services/auth-flow.service';

export const PasswordLoginFlowGuard: CanActivateFn = () => {
  const flow = inject(AuthFlowService);
  const router = inject(Router);

  const mobile = flow.getState()?.mobile;

  if (mobile) {
    return true;
  }

  return router.createUrlTree(['/auth/mobile']);
};
