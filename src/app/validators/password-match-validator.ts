import {AbstractControl, ValidationErrors} from '@angular/forms';

export function passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirm  = group.get('password_confirmation')?.value;
  return password === confirm ? null : { passwordMismatch: true };
}
