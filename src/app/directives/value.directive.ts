import {Directive, ElementRef, Input, Renderer2} from '@angular/core';

@Directive({
  selector: '[appValue]',
  standalone: true
})
export class ValueDirective {
  @Input('appValue') set appValue(value: any) {
    this.renderer.setAttribute(this.el.nativeElement, 'data-value', value);
  }

  constructor(private el: ElementRef, private renderer: Renderer2) {}

}
