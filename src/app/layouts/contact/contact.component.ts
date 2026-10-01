import {Component, inject, OnInit, signal} from '@angular/core';
import {Contact} from '../../interfaces/contact';
import {ContactService} from '../../services/contact.service';

@Component({
  selector: 'app-department',
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss',
})
export class ContactComponent implements OnInit {

  contacts = signal<Contact[]>([]);
  readonly initialized = signal(false);

  private contactService =  inject(ContactService);

  ngOnInit() {
    this.fetchContacts();
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
}
