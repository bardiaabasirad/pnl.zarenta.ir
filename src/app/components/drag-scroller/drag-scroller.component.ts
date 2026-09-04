import {Component, Input, ChangeDetectionStrategy} from '@angular/core';

@Component({
  selector: 'app-drag-scroller',
  templateUrl: './drag-scroller.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./drag-scroller.component.scss']
})
export class DragScrollerComponent {
  @Input() styles: string = '';
}
