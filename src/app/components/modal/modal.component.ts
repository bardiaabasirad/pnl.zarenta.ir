import { AfterViewInit, Component, DestroyRef, ElementRef, inject, input, output, viewChild } from '@angular/core';
import { Modal, ModalInterface, ModalOptions } from 'flowbite';

let nextModalId = 0;

@Component({
  selector: 'app-modal',
  standalone: true,
  templateUrl: './modal.component.html',
  host: {
    class: 'block h-0',
  },
})
export class AppModal implements AfterViewInit {
  readonly panelClass = input('max-w-2xl');
  readonly closed = output<void>();
  readonly modalId = `app-modal-${++nextModalId}`;

  private readonly dialog = viewChild.required<ElementRef<HTMLElement>>('dialog');
  private modal: ModalInterface | null = null;

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.modal?.hide();
      this.modal = null;
    });
  }

  ngAfterViewInit(): void {
    const options: ModalOptions = {
      placement: 'center',
      backdrop: 'dynamic',
      backdropClasses: 'bg-gray-900/50 dark:bg-gray-900/80 fixed inset-0 z-50',
      closable: true,
      onHide: () => this.closed.emit(),
    };

    this.modal = new Modal(this.dialog().nativeElement, options);
  }

  show(): void {
    this.modal?.show();
  }

  hide(): void {
    this.modal?.hide();
  }
}
