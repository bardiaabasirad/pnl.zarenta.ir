import {Component, EventEmitter, Input, Output, ChangeDetectionStrategy} from '@angular/core';
import {CommonModule} from '@angular/common';

@Component({
  selector: 'app-button-with-loader',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './button-with-loader.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./button-with-loader.component.scss']
})
export class ButtonWithLoaderComponent {
  @Input() type: string = 'submit';
  @Input() classes: string = '';
  @Input() disabled: boolean = false;
  @Input() loading: boolean = false;
  @Input() bubble_color: string = 'bg-white';
  @Input() loading_bg: string = 'bg-transparent';
  @Output() clicked = new EventEmitter<boolean>();

  public clickedOn() {
    this.clicked.emit(true);
  }

}
