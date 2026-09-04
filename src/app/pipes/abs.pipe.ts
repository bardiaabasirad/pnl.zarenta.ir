import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'abs',
  standalone: true
})
export class AbsPipe implements PipeTransform {

  transform(value: number | string | null | undefined): number {
    const num = Number(value) || 0;
    return Math.abs(num);
  }

}
