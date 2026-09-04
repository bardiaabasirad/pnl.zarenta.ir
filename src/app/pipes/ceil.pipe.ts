import { Pipe } from '@angular/core';

@Pipe({
    name: 'ceil',
})
export class CeilPipe {
  transform(value: number): number {
    if(value < 1000) return value;

    return Math.ceil(value / 1000) * 1000
  }
}
