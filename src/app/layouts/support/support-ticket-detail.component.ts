import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  viewChild,
  ElementRef,
  afterNextRender,
  Injector,
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {Title} from '@angular/platform-browser';
import {environment} from '../../../environments/environment';
import {SupportTicketService} from '../../services/support-ticket.service';
import {ButtonWithLoaderComponent} from '../../components/button-with-loader/button-with-loader.component';
import {SanitizeImageURLPipe} from '../../pipes/sanitize-image-url.pipe';
import moment from 'jalali-moment';

@Component({
  selector: 'app-support-ticket-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ButtonWithLoaderComponent, SanitizeImageURLPipe],
  templateUrl: './support-ticket-detail.component.html',
  styleUrl: './support-ticket-detail.component.css',
})
export class SupportTicketDetailComponent implements OnInit, OnDestroy {
  private ticketService = inject(SupportTicketService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private titleService = inject(Title);
  private injector = inject(Injector);

  private readonly messagesContainer = viewChild<ElementRef<HTMLDivElement>>('messagesContainer');
  private readonly messagesContent = viewChild<ElementRef<HTMLDivElement>>('messagesContent');
  private readonly replyImageInput = viewChild<ElementRef<HTMLInputElement>>('replyImage');

  private resizeObserver: ResizeObserver | null = null;
  private stickToBottom = true;

  loading = signal(true);
  submitting = signal(false);
  closing = signal(false);
  error = signal<string | null>(null);
  ticket = signal<any | null>(null);

  replyBody = '';
  imageFile: File | null = null;
  imagePreview: string | null = null;
  selectedRating: number | null = null;
  showClosePanel = false;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/support']);
      return;
    }
    this.fetchTicket(id);
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
  }

  fetchTicket(id: string | number): void {
    this.loading.set(true);
    this.ticketService.show(id).subscribe({
      next: (res) => {
        const data = res?.data;
        this.ticket.set(data);
        this.titleService.setTitle(`${data?.subject || 'تیکت'} | ${environment.appTitle || 'زرنتا'}`);
        this.loading.set(false);
        this.stickToBottom = true;
        this.scrollMessagesToBottom();
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'تیکت یافت نشد.');
        this.loading.set(false);
      },
    });
  }

  pickImage(): void {
    this.replyImageInput()?.nativeElement.click();
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
    const input = this.replyImageInput()?.nativeElement;
    if (input) {
      input.value = '';
    }
  }

  sendReply(): void {
    const current = this.ticket();
    if (!current || !this.replyBody.trim() || this.submitting()) {
      return;
    }

    this.submitting.set(true);
    this.error.set(null);

    const formData = new FormData();
    formData.append('body', this.replyBody.trim());
    if (this.imageFile) {
      formData.append('image', this.imageFile);
    }

    this.ticketService.reply(current.id, formData).subscribe({
      next: (res) => {
        this.ticket.set(res.data);
        this.replyBody = '';
        this.clearImage();
        this.submitting.set(false);
        this.stickToBottom = true;
        this.scrollMessagesToBottom();
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'ارسال پیام ناموفق بود.');
        this.submitting.set(false);
      },
    });
  }

  closeTicket(): void {
    const current = this.ticket();
    if (!current || this.closing()) {
      return;
    }

    this.closing.set(true);
    this.error.set(null);

    const body: {rating?: number} = {};
    if (this.selectedRating) {
      body.rating = this.selectedRating;
    }

    this.ticketService.close(current.id, body).subscribe({
      next: (res) => {
        this.ticket.set(res.data);
        this.showClosePanel = false;
        this.closing.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'بستن تیکت ناموفق بود.');
        this.closing.set(false);
      },
    });
  }

  onMessagesScroll(): void {
    const el = this.messagesContainer()?.nativeElement;
    if (!el) {
      return;
    }
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    this.stickToBottom = distanceFromBottom <= 64;
  }

  isAdminMessage(message: any): boolean {
    return message?.sender_type === 'admin';
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

  formatDate(value: string | null | undefined): string {
    if (!value) {
      return '';
    }
    return moment(value).locale('fa').format('jYYYY/jMM/jDD HH:mm');
  }

  private applyScrollToBottom(): void {
    const el = this.messagesContainer()?.nativeElement;
    if (!el || !this.stickToBottom) {
      return;
    }
    el.scrollTop = el.scrollHeight;
  }

  private bindMessagesResizeObserver(): void {
    const container = this.messagesContainer()?.nativeElement;
    const content = this.messagesContent()?.nativeElement;
    if (!container || !content) {
      return;
    }

    this.resizeObserver?.disconnect();
    this.resizeObserver = new ResizeObserver(() => {
      this.applyScrollToBottom();
    });
    this.resizeObserver.observe(content);
    this.applyScrollToBottom();
  }

  private scrollMessagesToBottom(): void {
    const attempt = (remaining: number) => {
      const container = this.messagesContainer()?.nativeElement;
      const content = this.messagesContent()?.nativeElement;
      if (container && content) {
        this.bindMessagesResizeObserver();
        this.applyScrollToBottom();
        requestAnimationFrame(() => this.applyScrollToBottom());
        return;
      }

      if (remaining <= 0) {
        return;
      }

      setTimeout(() => attempt(remaining - 1), 16);
    };

    afterNextRender(() => attempt(20), {injector: this.injector});
    setTimeout(() => attempt(20), 0);
  }
}
