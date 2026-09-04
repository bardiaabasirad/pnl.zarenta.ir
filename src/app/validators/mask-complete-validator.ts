import {AbstractControl, ValidationErrors, ValidatorFn} from '@angular/forms';

export function maskCompleteValidator(expectedLength: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null; // اگر خالی است، required validator آن را handle می‌کند
    }

    // فقط اعداد را استخراج کن
    const numericValue = String(control.value).replace(/\D/g, '');

    // بررسی طول (باید دقیقاً 11 رقم باشد)
    if (numericValue.length !== expectedLength) {
      return {
        maskIncomplete: {
          requiredLength: expectedLength,
          actualLength: numericValue.length
        }
      };
    }

    return null;
  };
}
