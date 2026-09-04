import {Pipe} from '@angular/core';

@Pipe({
  name: 'floor',
})
export class FloorPipe {
  constructor() {
  }

  transform(value: number): number {
    if (value < 1000) return value;

    return Math.floor(value / 1000) * 1000
  }
}
