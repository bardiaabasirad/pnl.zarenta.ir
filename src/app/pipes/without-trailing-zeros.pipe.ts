import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'withoutTrailingZeros',
  standalone: true,
})
export class WithoutTrailingZerosPipe implements PipeTransform {

  transform(value: number | string | undefined | null): number {
    if (! value) return 0;
    // تبدیل عدد به رشته
    let numberString = value.toString();

    // حذف صفرهای اضافی در انتهای رشته
    numberString = numberString.replace(/(\.\d*?[1-9])0+$/, '$1');

    // اگر عدد پس از حذف صفرها به عدد صحیح تبدیل شود، حذف نقطه از انتهای عدد
    if (numberString.endsWith('.')) {
      numberString = numberString.slice(0, -1);
    }

    return parseFloat(numberString);
  }

}
