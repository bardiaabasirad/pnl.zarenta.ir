import {Component, Input, ChangeDetectionStrategy} from '@angular/core';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-factor-separator',
  standalone: true,
  templateUrl: './factor-separator.component.html',
  imports: [
    NgClass
],
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './factor-separator.component.scss'
})
export class FactorSeparatorComponent {
  @Input() text: string = '';
  @Input() mb: string = '';
}
