import {
  Directive,
  ElementRef,
  EventEmitter,
  HostListener,
  Output,
} from '@angular/core';

@Directive({
  selector: '[appClickListener]',
  standalone: true
})
export class ClickListenerDirective {

  @Output() clickEvent = new EventEmitter<any>();

  constructor(public el: ElementRef) {}

  @HostListener('click', ['$event'])
  handleClick(event: Event) {
    this.clickEvent.emit(); // Emit the element directly
  }

}
