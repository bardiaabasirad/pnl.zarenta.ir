import {Component, ElementRef, OnInit, inject, signal, viewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {RouterLink} from '@angular/router';
import {Title} from '@angular/platform-browser';
import {environment} from '../../../environments/environment';
import {SupportTicketService} from '../../services/support-ticket.service';
import {ButtonWithLoaderComponent} from '../../components/button-with-loader/button-with-loader.component';
import moment from 'jalali-moment';

@Component({
  selector: 'app-support-tickets',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ButtonWithLoaderComponent],
  templateUrl: './support-tickets.component.html',
  styleUrl: './support-tickets.component.css',
})
export class SupportTicketsComponent implements OnInit {
  private ticketService = inject(SupportTicketService);
  private titleService = inject(Title);
  private readonly imageInput = viewChild<ElementRef<HTMLInputElement>>('imageInput');

  loading = signal(true);
  submitting = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);
  tickets = signal<any[]>([]);

  subject = '';
  body = '';
  imageFile: File | null = null;
  imagePreview: string | null = null;

  ngOnInit(): void {
    this.titleService.setTitle(`پشتیبانی با تیکت | ${environment.appTitle || 'زرنتا'}`);
    this.fetchTickets();
  }

  fetchTickets(): void {
    this.loading.set(true);
    this.ticketService.index('count=50').subscribe({
      next: (res) => {
        this.tickets.set(res?.data?.data ?? []);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'خطا در دریافت تیکت‌ها');
        this.loading.set(false);
      },
    });
  }

  pickImage(): void {
    this.imageInput()?.nativeElement.click();
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.error.set(null);

    if (!file) {
      this.imageFile = null;
      this.imagePreview = null;
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      this.error.set('حجم تصویر نباید بیشتر از ۲ مگابایت باشد.');
      input.value = '';
      return;
    }

    this.imageFile = file;
    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreview = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  clearImage(): void {
    this.imageFile = null;
    this.imagePreview = null;
    const input = this.imageInput()?.nativeElement;
    if (input) {
      input.value = '';
    }
  }

  submit(): void {
    if (!this.subject.trim() || !this.body.trim() || this.submitting()) {
      return;
    }

    this.submitting.set(true);
    this.error.set(null);
    this.success.set(null);

    const formData = new FormData();
    formData.append('subject', this.subject.trim());
    formData.append('body', this.body.trim());
    if (this.imageFile) {
      formData.append('image', this.imageFile);
    }

    this.ticketService.create(formData).subscribe({
      next: (res) => {
        this.success.set(res?.message || 'تیکت ثبت شد.');
        this.subject = '';
        this.body = '';
        this.clearImage();
        this.submitting.set(false);
        this.fetchTickets();
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'ثبت تیکت ناموفق بود.');
        this.submitting.set(false);
      },
    });
  }

  statusLabel(status: string): string {
    switch (status) {
      case 'open':
        return 'باز';
      case 'answered':
        return 'پاسخ داده‌شده';
      case 'closed':
        return 'بسته';
      case 'auto_closed':
        return 'بسته خودکار';
      default:
        return status;
    }
  }

  statusClass(status: string): string {
    switch (status) {
      case 'open':
        return 'bg-amber-100 text-amber-800';
      case 'answered':
        return 'bg-emerald-100 text-emerald-800';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  }

  formatDate(value: string | null | undefined): string {
    if (!value) {
      return '';
    }
    return moment(value).locale('fa').format('jYYYY/jMM/jDD HH:mm');
  }
}
