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

  stepTitle: string = 'درخواست شما با موفقیت ثبت شد';
  stepMsg: string = `اطلاعات شما به دست ما رسید؛ همکاران ما در ${environment.appTitle} به‌زودی برای ادامه مراحل و پاسخ به سوالاتتان با شما تماس خواهند گرفت.`;

  goToLogin(): void {
    this.flow.clear();
    this.router.navigate(['/auth/mobile']);
  }
}
