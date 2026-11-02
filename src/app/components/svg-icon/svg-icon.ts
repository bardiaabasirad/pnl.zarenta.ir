import { Component, input } from '@angular/core';
import {NgClass} from '@angular/common';

@Component({
  selector: 'app-svg-icon',
  standalone: true,
  imports: [
    NgClass
  ],
  template: `
    <svg [ngClass]="class()">
      <use [attr.href]="'icons/sprite.svg#icon-' + name()"></use>
    </svg>
  `,
})
export class SvgIcon {
  name = input.required<string>();
  class = input<string>('size-5 fill-gray-700 dark:fill-gray-300');
}
