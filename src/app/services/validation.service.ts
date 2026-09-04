import { Injectable } from '@angular/core';
import { AbstractControl, ValidationErrors } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';

interface NormalizedError {
  key: string;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class ValidationService {
  // Convert Laravel validation errors to Angular format
  normalizeBackendErrors(error: HttpErrorResponse): ValidationErrors {
    const normalizedErrors: ValidationErrors = {};

    if (error.error && error.error.errors) {
      // Laravel returns errors in format: { field: ['error1', 'error2'] }
      Object.keys(error.error.errors).forEach(key => {
        const messages = error.error.errors[key];
        normalizedErrors[key] = {
          serverError: Array.isArray(messages) ? messages[0] : messages
        };
      });
    }

    return normalizedErrors;
  }

  // Get all form errors (both Angular and Laravel)
  getFormErrors(control: AbstractControl): NormalizedError[] {
    const errors: NormalizedError[] = [];

    if (!control) return errors;

    if (control.errors) {
      Object.keys(control.errors).forEach(key => {
        errors.push({
          key: key,
          message: this.getErrorMessage(key, control.errors![key])
        });
      });
    }

    return errors;
  }

  // Convert validation error codes to human readable messages
  private getErrorMessage(key: string, error: any): string {
    const messages: { [key: string]: string } = {
      required: 'این فیلد ضروری است',
      maskIncomplete: `لطفاً شماره موبایل کامل (${error.requiredLength} رقم) را وارد کنید`,
      email: 'لطفا یک ایمیل معتبر وارد کنید',
      minlength: `حداقل ${error.requiredLength} کاراکتر باشد`,
      maxlength: `حداکثر ${error.requiredLength} کاراکتر باشد`,
      pattern: 'فرمت اشتباه است',
      serverError: error // Server errors are already in message format
    };

    return messages[key] || 'مقدار نامعتبر';
  }
}
