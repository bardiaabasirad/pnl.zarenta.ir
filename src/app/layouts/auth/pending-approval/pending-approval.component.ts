import { Component, ChangeDetectionStrategy } from '@angular/core';
import {environment} from '../../../../environments/environment';

@Component({
  selector: 'app-pending-approval',
  imports: [],
  templateUrl: './pending-approval.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './pending-approval.component.scss',
})
export class PendingApprovalComponent {
  stepTitle: string = 'درخواست شما با موفقیت ثبت شد';
  stepMsg: string = `اطلاعات شما به دست ما رسید؛ همکاران ما در ${environment.appTitle} به‌زودی برای ادامه مراحل و پاسخ به سوالاتتان با شما تماس خواهند گرفت.`;
}
