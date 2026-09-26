import {Component, inject, OnInit, ChangeDetectionStrategy, signal} from '@angular/core';
import {CraInquiryComponent} from "../partials/cra-inquiry/cra-inquiry.component";
import {NcrInquiryComponent} from "../partials/ncr-inquiry/ncr-inquiry.component";
import {BankInquiryComponent} from "../partials/bank-inquiry/bank-inquiry.component";
import {provideNgxMask} from "ngx-mask";
import {Title} from "@angular/platform-browser";
import {DatePipe, DecimalPipe, NgClass} from '@angular/common';
import {InquiryService} from '../../../services/inquiry.service';
import {User} from '../../../interfaces/user';
import {from} from 'rxjs';
import {StorageKey, StorageService} from '../../../services/storage.service';
import {AuthService} from '../../../services/auth.service';
import {IbanCardInquiryComponent} from '../partials/iban-card-inquiry/iban-card-inquiry.component';
import {IbanFromCardInquiryComponent} from '../partials/iban-from-card-inquiry/iban-from-card-inquiry.component';
import {Router} from '@angular/router';
import {initFlowbite} from 'flowbite';
import {environment} from '../../../../environments/environment';

@Component({
  selector: 'app-inquiries',
  standalone: true,
  imports: [
    CraInquiryComponent,
    NcrInquiryComponent,
    BankInquiryComponent,
    IbanCardInquiryComponent,
    NgClass,
    IbanFromCardInquiryComponent,
    DecimalPipe,
  ],
  providers: [
    provideNgxMask(),
    DatePipe
  ],
  templateUrl: './inquiries.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./inquiries.component.scss']
})

export class InquiriesComponent implements OnInit {
  user = signal<User | null | undefined>(undefined);
  private title = inject(Title);
  private inquiryService = inject(InquiryService);
  private authService = inject(AuthService);
  private router = inject(Router);
  initialized = signal<boolean>(false);
  costPerMatchingInquiry: number = 0;
  costPerSimilarityInquiry: number = 0;
  costPerShahkarInquiry: number = 0;
  costPerIbanOrCardInquiry: number = 0;
  costPerIbanFromCardInquiry: number = 0;
  bankInquiryType: string = 'iban-from-card';

  ngOnInit() {
    this.title.setTitle(`سامانه معاملات ${environment.appTitle} | استعلام‌ها`);

    this.getUserInfo();

    this.inquiryService.fee().subscribe({
      next: data => {
        this.costPerMatchingInquiry = data.cost_per_matching_inquiry;
        this.costPerSimilarityInquiry = data.cost_per_similarity_inquiry;
        this.costPerShahkarInquiry = data.cost_per_shahkar_inquiry;
        this.costPerIbanOrCardInquiry = data.cost_per_iban_or_card_inquiry;
        this.costPerIbanFromCardInquiry = data.cost_per_iban_from_card_inquiry;
        this.initialized.set(true);

        initFlowbite();
      },
      error: err => {
        console.log(err);
      }
    });
  }

  getUserInfo() {
    if (this.authService.isLoggedIn()) {
      from(this.authService.getUserInfo()).subscribe({
        next: () => {
          this.user.set(this.authService.getUser());

          // 🔹 بررسی دسترسی دقیقاً بعد از دریافت user
          if (!this.user()?.inquiry_access) {
            this.router.navigate(['/']);
            return;
          }
        },
        error: (error) => {
          if (error === 'Token expired') {
            this.user.set(undefined);
            StorageService.removeCookie(StorageKey.ACCESS_TOKEN);
          }
        }
      });
    } else {
      this.user.set(null);
    }
  }

  balanceChanged(e: any) {
    if (this.user()) {
      this.user.update(u => u ? { ...u, balance: e } : u);
    }
    this.authService.updateBalance(e);
  }
}
