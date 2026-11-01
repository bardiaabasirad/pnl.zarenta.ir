import { AbstractControl, ValidationErrors } from '@angular/forms';

/**
 * اعتبارسنجی شماره شبا مطابق قاعده IranianSheba در لاراول
 */
export function iranianShebaValidator(control: AbstractControl): ValidationErrors | null {
  const raw = control.value;

  if (raw === null || raw === undefined || raw === '') {
    return null;
  }

  if (typeof raw !== 'string' && typeof raw !== 'number') {
    return { sheba_invalid: 'شماره شبا معتبر نیست' };
  }

  let sheba = normalizeSheba(String(raw));

  if (!sheba.startsWith('IR')) {
    sheba = 'IR' + sheba;
  }

  if (!/^IR[0-9]{24}$/.test(sheba)) {
    return { sheba_format: 'فرمت شماره شبا صحیح نیست. شماره شبا باید با IR و ۲۴ رقم باشد' };
  }

  if (!isValidIbanChecksum(sheba)) {
    return { sheba_checksum: 'شماره شبا از نظر الگوریتم کنترلی معتبر نیست' };
  }

  return null;
}

export function normalizeSheba(value: string): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

  let result = value.trim();

  for (let i = 0; i < 10; i++) {
    result = result.replaceAll(persianDigits[i], String(i));
    result = result.replaceAll(arabicDigits[i], String(i));
  }

  return result.replace(/[\s\-_]/g, '').toUpperCase();
}

function isValidIbanChecksum(iban: string): boolean {
  const reordered = iban.slice(4) + iban.slice(0, 4);
  const numericString = reordered.slice(0, -4) + '1827' + reordered.slice(-2);
  return calculateMod97(numericString) === 1;
}

function calculateMod97(numericString: string): number {
  let remainder = 0;

  for (let i = 0; i < numericString.length; i += 7) {
    const chunk = String(remainder) + numericString.slice(i, i + 7);
    remainder = Number(chunk) % 97;
  }

  return remainder;
}
