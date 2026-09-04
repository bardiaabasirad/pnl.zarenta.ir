import {inject, Injectable} from '@angular/core';
import {FormControl, FormGroup} from '@angular/forms';
import moment from "jalali-moment";
import {DomSanitizer, SafeHtml, SafeResourceUrl} from "@angular/platform-browser";
import {ApiConfig} from '../configs/api.config';

@Injectable({
  providedIn: 'root' // Provide the service globally
})
export class UtilityService {

  private sanitizer = inject(DomSanitizer);

  isFieldDirty(fieldName: string, model: any, form: FormGroup, isDate: boolean = false): boolean {
    const control = form.get(fieldName);
    const fieldValue = isDate
      ? moment(model[fieldName], 'YYYY-MM-DD HH:mm:ss').locale('fa').format('YYYY-MM-DD HH:mm:ss')
      : this.stripHtmlAndMakeEmptyString(model[fieldName]);

    if (! control && fieldValue !== '') {
      return true;
    }

    const controlValue = this.stripHtmlAndMakeEmptyString(control?.value);

    return !!(model && fieldValue !== controlValue);
  }

  public stripHtmlAndMakeEmptyString(value: any): string {
    if (typeof value === 'number') {
      // If the value is a number, return it as is without stripping HTML
      return value.toString();
    }

    // If the value is not a number, proceed with stripping HTML
    return this.stripHtml(this.makeEmptyString(value));
  }


  private stripHtml(html: string)
  {
    let tmp = document.createElement("DIV");
    tmp.innerHTML = html.trim();
    return tmp.textContent || tmp.innerText || "";
  }

  hasError(field: FormControl): boolean{
    return field.invalid && (field.dirty || field.touched);
  }

  getErrorMessage(field: FormControl, title: string = 'این فیلد', message: string = ''): string | void {

    if (field.hasError('mask')){
      return `${title} وارد شده معتبر نیست`;
    }

    if (field?.hasError('required')) {
      return `${title} الزامی است`;
    }

    if (field?.hasError('national_code')) {
      return field?.getError('national_code');
    }

    if (field?.hasError('serverError')) {
      return field?.getError('serverError')!;
    }

    if (field?.hasError('pattern')) {
      return 'مقدار وارد شده نامعتبر است';
    }

    if (field?.hasError('maxlength')) {
      const maxLength = field?.getError('maxlength')?.requiredLength;
      return `${title} نمی‌تواند بیشتر از ${maxLength} حرف باشد`;
    }

    if (field?.hasError('maxValue')) {
      if (message){
        return message;
      }
      return `مقدار وارد شده بیش از حد مجاز می‌باشد`;
    }

    return field?.errors!.toString();

  }

  areArraysNotEqualById(arr1: any, arr2: any) {
    if (arr1.length !== arr2.length) {
      return true; // Different lengths, so arrays are definitely not equal
    }

    const idSet = new Set(arr1.map((obj: any) => obj.id));

    for (const obj of arr2) {
      if (!idSet.has(obj.id)) {
        return true; // Found an object with an id not present in arr1, so arrays are not equal
      }
    }

    return false; // All objects in arr2 have ids present in arr1, so arrays are equal
  }

  dataURItoBlob(dataURI: string): Blob {
    const byteString = atob(dataURI.split(',')[1]);
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
  }

  hasErrorMessage(field: FormControl): boolean{
    return field.invalid && (field.dirty || field.touched);
  }

  sanitizeImageURL(path: string): SafeResourceUrl {
    if(! path) return '';
    const imageUrl = `${ApiConfig.rootURL}/${path}`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(imageUrl);
  }

  getFilters(filters: any) {
    let filterString = '';

    for (const key in filters) {
      if (filters.hasOwnProperty(key) && filters[key]) {
        filterString += key + '=' + filters[key] + '&'
      }
    }

    let sortString = 'sortBy=created_at&dir=desc';

    return filterString + sortString;
  }

  objectExistsOnArray(id: number, array: any) {
    return array.some((item: any) => item.id === id);
  }

  private makeEmptyString(value: any): any{
    return value || '';
  }

  nl2br(value: string): SafeHtml {
    const htmlString = value.replace(/\n/g, '<br>');
    return this.sanitizer.bypassSecurityTrustHtml(htmlString);
  }

  convertToEnglishNumbers(input: string | undefined): string {
    if (typeof input !== 'string') {
      // If input is not a string, return the original input
      return input || '';
    }

    const persianArabicToEnglishMap: any = {
      '۰': '0',
      '۱': '1',
      '۲': '2',
      '۳': '3',
      '۴': '4',
      '۵': '5',
      '۶': '6',
      '۷': '7',
      '۸': '8',
      '۹': '9',
    };

    // Use regular expression to replace each Persian/Arabic digit with its English equivalent
    return input.replace(/[۰-۹]/g, (match) => {
      // Check if the matched digit is already an English digit
      if (/\d/.test(match)) {
        return match; // Return the original character
      } else {
        return persianArabicToEnglishMap[match] || match; // Convert to English or return the original character
      }
    });
  }

  convertToPersianNumbers(input: string | undefined): string {
    if (typeof input !== 'string') {
      // If input is not a string, return the original input
      return input || '';
    }

    const englishToPersianMap: any = {
      '0': '۰',
      '1': '۱',
      '2': '۲',
      '3': '۳',
      '4': '۴',
      '5': '۵',
      '6': '۶',
      '7': '۷',
      '8': '۸',
      '9': '۹',
    };

    // Use regular expression to replace each English digit with its Persian equivalent
    return input.replace(/\d/g, (match) => {
      return englishToPersianMap[match] || match; // Convert to Persian or return the original character
    });
  }

  convertToStandardPhoneNumber(input: string) {
    input = this.convertToEnglishNumbers(input);
    // Remove leading plus sign, leading zero, and country code
    return input.replace(/^\+?(98)?0?/, '');
  }

  replaceWithSpaces(originalString: string, separator: string = '-'){
    return  originalString.replace(/[\s»«()+‌،]+/g, separator).replace(/-+/g, '-').replace(/^-|-$/g, '');
  }
}
