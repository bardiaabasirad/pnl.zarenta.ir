import {AbstractControl, ValidationErrors, ValidatorFn} from '@angular/forms';
import {convertToEnglishNumbersUtil} from './convert-to-english-numbers.util';

/** Keep digits while typing; allow up to 13 for 98XXXXXXXXXX */
export function sanitizeMobileTyping(value: unknown): string {
  let phone = convertToEnglishNumbersUtil(String(value ?? '')).replace(/\D/g, '');
  if (phone.length > 13) {
    phone = phone.slice(0, 13);
  }
  return phone;
}

/**
 * Canonical national format: 9XXXXXXXXX
 * Accepts: 09382126008 | 9382126008 | +989382126008 | 989382126008
 */
export function toIranianMobileNational(value: unknown): string | null {
  let phone = convertToEnglishNumbersUtil(String(value ?? '')).replace(/\D/g, '');

  if (phone.startsWith('0098')) {
    phone = phone.slice(4);
  } else if (phone.startsWith('98') && phone.length >= 12) {
    phone = phone.slice(2);
  }

  if (phone.startsWith('0')) {
    phone = phone.slice(1);
  }

  return /^9\d{9}$/.test(phone) ? phone : null;
}

/** Display format: 09XXXXXXXXX */
export function toIranianMobileDisplay(value: unknown): string | null {
  const national = toIranianMobileNational(value);
  return national ? `0${national}` : null;
}

export function iranianMobileValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null;
    }

    return toIranianMobileNational(control.value)
      ? null
      : {phoneInvalid: true};
  };
}
