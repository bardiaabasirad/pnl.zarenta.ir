import { AbstractControl, ValidationErrors } from '@angular/forms';

export function nationalCodeValidator(control: AbstractControl): ValidationErrors | null {
  const code = control.value;

  if (! code) return null;

  // if (code.length !== 10 || /(\d)(\1){9}/.test(code)) return { 'national_code': 'کد ملی وارد شده معتبر نیست' };
  if (code.length !== 10 || /(\d)(\1){9}/.test(code)) return null;

  let sum = 0,
    chars = code.split(''),
    lastDigit,
    remainder;

  for (let i = 0; i < 9; i++) sum += +chars[i] * (10 - i);

  remainder = sum % 11;
  lastDigit = remainder < 2 ? remainder : 11 - remainder;

  if (+chars[9] !== lastDigit){
    return { 'national_code': 'کد ملی وارد شده معتبر نیست' };
  }

  // If everything is valid, return null
  return null;
}
