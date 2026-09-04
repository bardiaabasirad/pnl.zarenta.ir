import {
  Component,
  DestroyRef,
  inject,
  input,
  OnInit,
  output,
  signal,
  ChangeDetectionStrategy
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval, Subscription } from 'rxjs';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-progress-bar',
  imports: [NgClass],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './progress-bar.component.html',
})
export class ProgressBarComponent implements OnInit {
  // ورودی‌های مبتنی بر signal
  readonly expirationTime = input<number>(60);
  readonly progressColor = input<string>('bg-emerald-500');
  readonly createdTime = input<string>('');
  readonly now = input<string>('');

  // خروجی‌ها با output() به‌جای @Output + EventEmitter
  readonly progressUpdate = output<{ progress: number; remainingTime: number }>();
  readonly completed = output<void>();

  // وضعیت داخلی به‌صورت signal (قابل استفاده در تمپلیت با progress()/remainingTime())
  readonly progress = signal<number>(100);
  readonly remainingTime = signal<number>(0);

  private readonly destroyRef = inject(DestroyRef);

  private serverNowMs = 0;
  private clientAnchorMs = 0;
  private createdMs = 0;
  private finished = false;
  private tickSub?: Subscription;

  private readonly onVisibility = (): void => {
    if (document.visibilityState === 'visible') {
      this.tick();
    }
  };

  ngOnInit(): void {
    this.serverNowMs = this.parseTehranTime(this.now());
    this.createdMs = this.parseTehranTime(this.createdTime());
    this.clientAnchorMs = Date.now();

    this.start();

    document.addEventListener('visibilitychange', this.onVisibility);
    // پاکسازی بدون نیاز به OnDestroy
    this.destroyRef.onDestroy(() =>
      document.removeEventListener('visibilitychange', this.onVisibility),
    );
  }

  public start(): void {
    this.tickSub?.unsubscribe();

    // محاسبه‌ی فوری وضعیت؛ اولین emit را به بیرون از چرخه‌ی جاری می‌بریم
    this.tick(true);

    // takeUntilDestroyed خودش هنگام نابودی کامپوننت، اشتراک را لغو می‌کند
    this.tickSub = interval(1000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.tick());
  }

  private parseTehranTime(value: string): number {
    return new Date(value.replace(' ', 'T') + '+03:30').getTime();
  }

  private currentServerTimeMs(): number {
    return this.serverNowMs + (Date.now() - this.clientAnchorMs);
  }

  private tick(deferEmit = false): void {
    if (this.finished) {
      return;
    }

    const expiration = this.expirationTime();
    const elapsedSec = (this.currentServerTimeMs() - this.createdMs) / 1000;
    const remaining = Math.max(0, Math.ceil(expiration - elapsedSec));
    const progress = Math.max(0, Math.min(100, (remaining / expiration) * 100));

    this.remainingTime.set(remaining);
    this.progress.set(progress);

    const payload = { progress, remainingTime: remaining };

    if (deferEmit) {
      // جلوگیری از emit در حین مقداردهی اولیه
      queueMicrotask(() => this.progressUpdate.emit(payload));
    } else {
      this.progressUpdate.emit(payload);
    }

    if (remaining <= 0) {
      this.finished = true;
      this.tickSub?.unsubscribe();
      this.completed.emit();
    }
  }
}
