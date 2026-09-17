import {
  Component,
  effect,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  viewChild,
  ChangeDetectionStrategy,
  signal
} from '@angular/core';
import {AuthFlowService} from '../../../services/auth-flow.service';
import {Router} from '@angular/router';
import {ButtonWithLoaderComponent} from '../../../components/button-with-loader/button-with-loader.component';
import {NgxMaskDirective, provideNgxMask} from 'ngx-mask';
import {FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {convertToEnglishNumbersUtil} from '../../../utils/convert-to-english-numbers.util';
import {AuthService} from '../../../services/auth.service';
import {ErrorDisplayComponent} from '../../../components/error-display/error-display.component';

@Component({
  selector: 'app-verify-code-step',
  imports: [
    ButtonWithLoaderComponent,
    NgxMaskDirective,
    ReactiveFormsModule,
    ErrorDisplayComponent
  ],
  templateUrl: './verify-code-step.component.html',
  styleUrl: './verify-code-step.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
  providers: [provideNgxMask()]
})
export class VerifyCodeStepComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private flow = inject(AuthFlowService);
  private formBuilder = inject(FormBuilder);
  private authService = inject(AuthService);

  verifyForm!: FormGroup;

  remainingSeconds = 0;
  submitting = signal<boolean>(false);
  isResending = signal<boolean>(false);
  statusError = '';
  private _sentAt = 0;
  private _timeRemaining = 0;
  private readonly _onVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      this.startCountdown(this._timeRemaining, this._sentAt);
    }
  };
  state: any;

  // ─── Circle progress ───────────────────────────────────────────────
  radius = 0;
  circumference = 0;
  readonly totalTime = 120;
  countdownInterval: any;

  // ─── View refs ─────────────────────────────────────────────────────
  circle = viewChild<ElementRef>('circle');

  public p2e = (value: unknown): string => convertToEnglishNumbersUtil(String(value));

  constructor() {
    this.verifyForm = this.formBuilder.group({
      phone: new FormControl('', [Validators.required]),
      verification_code: new FormControl('', {
        validators: [Validators.required, Validators.minLength(6)]
      }),
    });

    effect(() => {
      if (this.circle()) this.initCircle();
    });
  }

  ngOnInit(): void {
    this.state = this.flow.getState();

    if (!this.state?.mobile) {
      this.router.navigate(['/auth/mobile']);
      return;
    }

    this.verifyForm.patchValue({phone: this.state.mobile});
    this.startCountdown(this.state.time_remaining, this.state.otp_sent_at);

    document.addEventListener('visibilitychange', this._onVisibilityChange);
  }

  ngOnDestroy(): void {
    clearInterval(this.countdownInterval);
    document.removeEventListener('visibilitychange', this._onVisibilityChange);
  }

  loginByPassword() {
    this.router.navigate(['/auth/password']);
  }

  back() {
    this.flow.clear();
    this.router.navigate(['/auth/mobile']);
  }

  // ─── تایید کد ──────────────────────────────────────────────────────
  async verify(): Promise<void> {
    if (this.verifyForm.invalid) {
      this.verifyForm.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.statusError = '';

    const payload = {
      phone: this.verifyForm.value.phone,
      verification_code: this.verifyForm.value.verification_code,
      action: this.state?.action ?? 'login',
    };

    this.authService.verifyOtp(payload).subscribe({
      next: (res) => {
        console.log('set to false')
        this.submitting.set(false);

        switch (res.next_action) {
          case 'pending':
            // کاربر تازه ثبت شده — نام و نام خانوادگی دریافت شود
            this.flow.setState({
              ...this.state,
              token: res.token, // توکن موقت برای ذخیره پروفایل
            });
            this.router.navigate(['/auth/pending']);
            break;

          case 'complete-profile':
            // کاربر تازه ثبت شده — نام و نام خانوادگی دریافت شود
            this.flow.setState({
              ...this.state,
              token: res.token, // توکن موقت برای ذخیره پروفایل
            });
            this.router.navigate(['/auth/complete-profile']);
            break;

          case 'reset-credentials':
            // بازیابی رمز عبور
            this.flow.setState({
              ...this.state,
              reset_token: res.reset_token,
            });
            this.router.navigate(['/auth/reset-credentials']);
            break;

          case 'rejected-request':
            this.flow.setState({
              ...this.state,
              review_token: res.review_token,
            });

            this.router.navigate(['/auth/rejected']);
            break;

          case 'home':
          default:
            // لاگین موفق
            this.flow.clear();

            const returnUrl = this.authService.login(res);

            this.router.navigate([returnUrl || '/']);

            break;
        }
      },
      error: (err) => {
        console.log('set to false')
        this.submitting.set(false);

        if (err.status === 422) {
          const errors = err.error?.errors;
          if (errors?.verification_code) {
            this.statusError = errors.verification_code[0];
          } else {
            this.statusError = err.error?.message ?? 'کد وارد شده نادرست است.';
          }
        } else if (err.status === 403) {
          this.router.navigate(['/auth/banned']);
          this.statusError = err.error?.message ?? 'حساب کاربری شما غیرفعال است. با پشتیبانی تماس بگیرید.';
        } else if (err.status === 429) {
          this.statusError = 'تعداد تلاش‌های مجاز تجاوز کرده. لطفاً چند دقیقه صبر کنید.';
        } else {
          this.statusError = 'خطایی رخ داد. لطفاً دوباره تلاش کنید.';
        }
      }
    });
  }

  // ─── دریافت مجدد کد ────────────────────────────────────────────────
  async getNewCode(): Promise<void> {
    if (this.isResending() || this.remainingSeconds > 0) return;

    this.isResending.set(true);
    this.statusError = '';

    this.authService.sendOtp({phone: this.state.mobile, force_otp: this.state.force_otp, action: this.state.action}).subscribe({
      next: (res) => {
        console.log('isResending set to false');
        this.isResending.set(false);

        // state جدید با timestamp تازه
        this.flow.setState({
          ...this.state,
          time_remaining: res.time_remaining,
          otp_sent_at: Date.now(),
        });

        // شمارش معکوس را ریست و شروع کن
        this.startCountdown(res.time_remaining, Date.now());
      },
      error: (err) => {
        console.log('isResending set to false');
        this.isResending.set(false);

        if (err.status === 429) {
          this.statusError = 'درخواست‌های زیادی ارسال شده. لطفاً صبر کنید.';
        } else {
          this.statusError = 'ارسال مجدد کد با خطا مواجه شد.';
        }
      }
    });
  }

  // ─── تغییر شماره ───────────────────────────────────────────────────
  changeNumber(): void {
    this.flow.clear();
    this.router.navigate(['/auth/mobile']);
  }

  // ─── شمارش معکوس ───────────────────────────────────────────────────
  private startCountdown(timeRemaining: number, sentAt: number): void {
    clearInterval(this.countdownInterval);
    this._sentAt = sentAt;           // ← اضافه شد
    this._timeRemaining = timeRemaining; // ← اضافه شد

    const elapsed = Math.floor((Date.now() - sentAt) / 1000);

    this.remainingSeconds = Math.max(0, timeRemaining - elapsed);

    if (this.remainingSeconds <= 0) return;

    this.countdownInterval = setInterval(() => {
      if (this.remainingSeconds > 0) {
        this.remainingSeconds--;
        const percentElapsed = ((this.totalTime - this.remainingSeconds) / this.totalTime) * 100;
        this.setProgress(percentElapsed);

        if (this.remainingSeconds <= 0) {
          clearInterval(this.countdownInterval);
        }
      } else {
        clearInterval(this.countdownInterval);
      }
    }, 1000);
  }

  initCircle(): void {
    const el = this.circle()?.nativeElement;
    if (!el) return;
    this.radius = el.r.baseVal.value;
    this.circumference = this.radius * 2 * Math.PI;
    el.style.strokeDasharray = `${this.circumference} ${this.circumference}`;
    el.style.strokeDashoffset = '0';
  }

  setProgress(percent: number): void {
    const el = this.circle()?.nativeElement;
    if (el) el.style.strokeDashoffset = (percent / 100) * this.circumference;
  }
}
