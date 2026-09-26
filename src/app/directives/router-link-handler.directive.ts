import { Directive, HostListener, inject } from '@angular/core';
import { Router } from '@angular/router';

@Directive({
  selector: '[appRouterLinkHandler]',
  standalone: true
})
export class RouterLinkHandlerDirective {
  private router = inject(Router);

  @HostListener('click', ['$event'])
  onClick(event: MouseEvent) {
    // پیدا کردن نزدیک‌ترین تگ A به محل کلیک
    const target = (event.target as HTMLElement).closest('a');

    // اگر تگ A هست و اتریبیوت خاص ما رو داره
    if (target && target.hasAttribute('data-router-link')) {
      event.preventDefault(); // جلوگیری از رفرش صفحه

      const path = target.getAttribute('data-router-link');
      if (path) {
        this.router.navigateByUrl(path);
      }
    }
  }
}
