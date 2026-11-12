import {Component, ChangeDetectionStrategy, inject} from '@angular/core';
import {Router} from '@angular/router';
import {environment} from '../../../../environments/environment';
import {AuthFlowService} from '../../../services/auth-flow.service';

@Component({
  selector: 'app-pending-approval',
  imports: [],
  templateUrl: './pending-approval.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './pending-approval.component.css',
})
export class PendingApprovalComponent {
  private router = inject(Router);
  private flow = inject(AuthFlowService);

  /** 'submitted' = just finished registration; otherwise returning login while pending */
  private readonly context =
    (this.router.getCurrentNavigation()?.extras?.state?.['pendingContext']
      ?? history.state?.pendingContext
      ?? 'already_pending') as 'submitted' | 'already_pending';

  stepTitle =
    this.context === 'submitted'
      ? 'درخواست شما با موفقیت ثبت شد'
      : 'درخواست شما قبلاً ثبت شده است';

  stepMsg =
    this.context === 'submitted'
      ? `اطلاعات شما به دست ما رسید؛ همکاران ما در ${environment.appTitle} به‌زودی برای ادامه مراحل و پاسخ به سوالاتتان با شما تماس خواهند گرفت.`
      : `شما پیش‌تر درخواست ثبت‌نام خود را ارسال کرده‌اید و هم‌اکنون در صف بررسی قرار دارد. پس از تأیید، امکان ورود به پنل برای شما فعال می‌شود.`;

  goToLogin(): void {
    this.flow.clear();
    this.router.navigate(['/auth/mobile']);
  }
}
