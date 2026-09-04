import {Router} from '@angular/router';
import {inject} from "@angular/core";
import {AuthService} from "../services/auth.service";

export const guestGuard = () => {
  const userAuthService = inject(AuthService);
  const router = inject(Router);

  if (! userAuthService.isLoggedIn()) {
    return true;
  }

  // Redirect to the login page
  return router.parseUrl('/');
};
