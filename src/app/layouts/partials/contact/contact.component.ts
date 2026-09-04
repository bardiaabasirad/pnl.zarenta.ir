import {Component, inject, OnDestroy, OnInit, signal, ChangeDetectionStrategy} from '@angular/core';
import {Contact} from '../../../interfaces/contact';
import {ContactService} from '../../../services/contact.service';
import {Modal, ModalInterface, ModalOptions} from 'flowbite';

@Component({
  selector: 'app-department',
  imports: [],
  templateUrl: './contact.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './contact.component.scss',
})
export class ContactComponent implements OnInit, OnDestroy {

  contacts = signal<Contact[]>([]);
  readonly initialized = signal(false);

  private contactService =  inject(ContactService);

  supportModal: ModalInterface | undefined;

  ngOnInit() {
    this.fetchContacts();
    this.initSupportModal();
  }

  ngOnDestroy(): void {
    document.querySelector('#supportModal')?.remove();
  }

  fetchContacts() {
    this.contactService.index().subscribe({
      next: (data: any) => {
        this.contacts.set(data);
        this.initialized.set(true);
      },
      error: err => {
        this.initialized.set(true);
      }
    })
  }

  initSupportModal(): void {
    const $modalElement: HTMLElement | null = document.querySelector('#supportModal');

    if ($modalElement) {
      // انتقال modal به body برای جلوگیری از مشکل stacking context
      document.body.appendChild($modalElement);
    }

    const modalOptions: ModalOptions = {
      placement: 'center',
      backdrop: 'dynamic',
      backdropClasses: 'bg-gray-900/50 dark:bg-gray-900/80 fixed inset-0 z-50',
      closable: true,
    };

    this.supportModal = new Modal($modalElement, modalOptions);
  }
}
