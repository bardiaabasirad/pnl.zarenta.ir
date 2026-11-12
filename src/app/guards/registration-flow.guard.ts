import {inject} from '@angular/core';
import {CanActivateFn, Router} from '@angular/router';
import {AuthFlowService} from '../services/auth-flow.service';

export const RegistrationFlowGuard: CanActivateFn = () => {
  const flow = inject(AuthFlowService);
  const router = inject(Router);

  if (flow.getState()?.mobile) {
    return true;
  }

  return router.createUrlTree(['/auth/mobile']);
};
