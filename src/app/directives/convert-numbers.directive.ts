import {Directive, ElementRef, HostListener} from '@angular/core';
import {NgControl} from "@angular/forms";

@Directive({
  selector: '[convertNumbers]',
  standalone: true
})
export class ConvertNumbersDirective {
  constructor(private ngControl: NgControl) {}

  @HostListener('input', ['$event.target.value'])
  onInput(value: string) {
    // Convert Persian numbers to English numbers
    const convertedValue = this.convertToEnglishNumbers(value);
    this.ngControl.control?.setValue(convertedValue, { emitEvent: false });
  }

  private convertToEnglishNumbers(persianValue: string): string {
    // Implement your conversion logic here
    // Example: Replace Persian digits with English equivalents
    // (you might need a more comprehensive mapping)
    return persianValue.replace(/[\u06F0-\u06F9]/g, (char) => {
      const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
      const englishDigits = '0123456789';
      const index = persianDigits.indexOf(char);
      return index !== -1 ? englishDigits.charAt(index) : char;
    });
  }
}
