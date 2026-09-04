import { Injectable } from '@angular/core';
import {AbstractControl, FormGroup} from "@angular/forms";

@Injectable({
  providedIn: 'root'
})
export class ErrorHandlingService {
  handleErrors(error: any, component: any): void {
    if (error.status === 422) {
      // Validation errors were returned by the Laravel backend
      component.errors = error.error.errors;
    } else {
      // Handle other types of errors, e.g., server errors
      console.log('Server error:', error);
    }
  }

  handleFormErrors(error: any, formControls: { [key: string]: AbstractControl }): void {
    if (error.error.errors) {
      Object.keys(error.error.errors).forEach(key => {
        if (formControls[key]) {
          formControls[key].setErrors(error.error.errors[key]);
        }
      });
    }
  }

  handleFieldsErrors(error: any, form: FormGroup): void {
    if (error.error.errors) {
      Object.keys(error.error.errors).forEach(key => {
        if (form.get(key)) {
          form.get(key)?.setErrors({
            serverError: error.error.errors[key]
          });
        }
      });
    }
  }
}
