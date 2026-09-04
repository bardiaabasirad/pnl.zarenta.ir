import { Component, ChangeDetectionStrategy } from '@angular/core';
import {Router} from "@angular/router";

@Component({
  selector: 'app-blocked',
  imports: [],
  templateUrl: './blocked.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './blocked.component.scss',
})
export class BlockedComponent {
  constructor(private router: Router) {}

  retry(): void {
    // بازگشت به صفحه اصلی؛ اگر همچنان بلاک باشد، interceptor دوباره به /blocked هدایت می‌کند
    this.router.navigateByUrl('/', { replaceUrl: true });
  }
}
