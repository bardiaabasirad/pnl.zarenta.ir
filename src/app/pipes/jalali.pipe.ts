import { Pipe, PipeTransform } from '@angular/core';
import moment from 'jalali-moment';

@Pipe({
  name: 'jalali',
  standalone: true
})
export class JalaliPipe implements PipeTransform {

  transform(value: Date | string | number | null | undefined, format: string = 'dddd DD MMMM YYYY'): string {
    if (!value) return '';

    const timestamp = value instanceof Date ? value.getTime() : new Date(value).getTime();

    if (isNaN(timestamp)) return '';

    return moment(timestamp).locale('fa').format(format);
  }

}
