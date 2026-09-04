import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-pending-approval',
  imports: [],
  templateUrl: './pending-approval.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './pending-approval.component.scss',
})
export class PendingApprovalComponent {
  stepTitle: string = 'اطلاعات شما با موفقیت ثبت شد';
  stepMsg: string = 'کارشناسان ژیک به زودی برای تکمیل فرآیند عضویت و راهنمایی شما تماس خواهند گرفت';
}
