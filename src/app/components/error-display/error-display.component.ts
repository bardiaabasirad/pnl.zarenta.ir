import {Component, computed, input, inject, signal, ChangeDetectionStrategy} from '@angular/core';
import { AbstractControl } from '@angular/forms';

import { ValidationService } from '../../services/validation.service';

@Component({
  selector: 'app-error-display',
  standalone: true,
  templateUrl: './error-display.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './error-display.component.scss',
})
export class ErrorDisplayComponent {
  private validationService = inject(ValidationService);
  style = input<string>('text-xs font-medium text-red-500');

  // ✅ Signal-based input
  control = input<AbstractControl | null>(null);

  // ✅ Reactive & memoized errors
  errors = computed(() => {
    const ctrl = this.control();

    if (!ctrl) return [];

    // مهم: دسترسی به status باعث reactive شدن می‌شود
    ctrl.status;

    return this.validationService.getFormErrors(ctrl);
  });
}
