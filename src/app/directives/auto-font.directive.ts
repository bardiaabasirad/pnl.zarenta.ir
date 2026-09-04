import { AfterViewInit, Directive, ElementRef, Input, HostListener } from '@angular/core';

@Directive({
  selector: '[appAutoFont]',
  standalone: true,
})
export class AutoFontDirective implements AfterViewInit {
  /** حداقل اندازه‌ی فونت به واحد rem */
  @Input() minFont = 0.625; // معادل 10px در root پیش‌فرض 16px

  /** حداکثر اندازه‌ی فونت به واحد rem */
  @Input() maxFont = 1.25; // معادل 20px

  private currentScale = 1;

  constructor(private el: ElementRef<HTMLElement>) {}

  ngAfterViewInit() {
    this.adjustFont();
    // برای محتوای Async (مثل ngIf یا *ngFor)
    setTimeout(() => this.adjustFont(), 20);
  }

  @HostListener('window:resize')
  onResize() {
    this.adjustFont();
  }

  private adjustFont() {
    const element = this.el.nativeElement;
    const parent = element.parentElement;
    if (!parent) return;

    // دریافت اندازه‌ی زمینه (۱rem چند px است)
    const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize);

    // تبدیل rem به px برای محاسبه
    const maxPx = this.maxFont * rootFontSize;
    const minPx = this.minFont * rootFontSize;

    // بازنشانی فونت به حالت ماکزیمم برای اندازه‌گیری
    element.style.fontSize = `${this.maxFont}rem`;
    element.style.transformOrigin = 'center';
    element.style.transform = 'none';

    const parentWidth = parent.clientWidth;
    const contentWidth = element.scrollWidth;

    const scale = Math.min(1, parentWidth / contentWidth);

    // محاسبه فونت نهایی (بر حسب px)
    const computedPx = Math.max(minPx, maxPx * scale);

    // بازگرداندن به rem
    const computedRem = computedPx / rootFontSize;

    element.style.fontSize = `${computedRem}rem`;
    this.currentScale = scale;
  }
}
