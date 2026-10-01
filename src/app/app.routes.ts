import {Routes} from '@angular/router';
import {guestGuard} from './guards/guest.guard';
import {authGuard} from './guards/auth.guard';
import {geoBlockGuard} from './guards/geo-block.guard';
import {resetCredentialsGuard} from './guards/reset-credentials.guard';
import {PasswordLoginFlowGuard} from './guards/password-login-flow.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./layouts/main-layout/main-layout').then(m => m.MainLayout),
    canActivateChild: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./layouts/exchange/exchange.component').then(m => m.ExchangeComponent),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./layouts/profile/profile.component').then(m => m.ProfileComponent),
      },
      {
        path: 'contact-us',
        loadComponent: () =>
          import('./layouts/contact/contact.component').then(m => m.ContactComponent),
      },
      {
        path: 'inquiries',
        loadComponent: () =>
          import('./layouts/inquiries/inquiries/inquiries.component').then(m => m.InquiriesComponent),
      },
      {
        path: 'orders',
        loadChildren: () => import('./features/orders/orders.module').then(m => m.OrdersModule)
      },
      {
        path: 'transactions',
        loadChildren: () => import('./features/transaction/transaction.module').then(m => m.TransactionModule)
      },
      {
        path: 'settings',
        loadComponent: () => import('./layouts/settings/settings.component').then(c => c.SettingsComponent),
      },
      {
        path: 'assets',
        loadComponent: () => import('./layouts/assets/assets.component').then(c => c.AssetsComponent),
      },
    ]
  },
  {
    path: 'auth',
    loadComponent: () => import('./layouts/auth/auth-entry-layout/auth-entry-layout.component').then(m => m.AuthEntryLayoutComponent),
    canActivateChild: [guestGuard],
    children: [
      {
        path: 'mobile',
        loadComponent: () => import('./layouts/auth/mobile-step/mobile-step.component').then(m => m.MobileStepComponent),
      },
      {
        path: 'password',
        loadComponent: () => import('./layouts/auth/password-step/password-step.component').then(m => m.PasswordStepComponent),
        canActivate: [PasswordLoginFlowGuard],
      },
      {
        path: 'reset-credentials',
        loadComponent: () => import('./layouts/auth/reset-credentials/reset-credentials.component').then(m => m.ResetCredentialsComponent),
        canActivate: [resetCredentialsGuard],
      },
      {
        path: 'complete-profile',
        loadComponent: () => import('./layouts/auth/complete-profile/complete-profile.component').then(m => m.CompleteProfileComponent),
        canActivate: [],
      },
      {
        path: 'verify',
        loadComponent: () => import('./layouts/auth/verify-code-step/verify-code-step.component').then(m => m.VerifyCodeStepComponent),
      },
      {
        path: 'pending',
        loadComponent: () => import('./layouts/auth/pending-approval/pending-approval.component').then(m => m.PendingApprovalComponent),
      },
      {
        path: 'rejected',
        loadComponent: () => import('./layouts/auth/rejected-request/rejected-request.component').then(m => m.RejectedRequestComponent),
      },
      {
        path: 'banned',
        loadComponent: () => import('./layouts/auth/banned/banned.component').then(m => m.BannedComponent),
      }
    ],
  },
  {
    path: 'blocked',
    loadComponent: () =>
      import('./layouts/blocked/blocked.component').then(m => m.BlockedComponent),
    canActivate: [geoBlockGuard]
  },
  {
    path: '404',
    loadComponent: () =>
      import('./layouts/not-found/not-found.component').then(m => m.NotFoundComponent),
  },
  {path: '**', redirectTo: '404'}
];
