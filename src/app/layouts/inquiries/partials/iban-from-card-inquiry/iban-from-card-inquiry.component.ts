import {Component, EventEmitter, inject, Input, Output, ChangeDetectionStrategy} from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import {FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {NgxMaskDirective} from 'ngx-mask';
import {ButtonWithLoaderComponent} from '../../../../components/button-with-loader/button-with-loader.component';
import {UtilityService} from '../../../../services/utility.service';
import {InquiryService} from '../../../../services/inquiry.service';
import {ErrorHandlingService} from '../../../../services/error-handling.service';
import {MatSnackBar} from '@angular/material/snack-bar';

@Component({
  selector: 'app-iban-from-card-inquiry',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NgxMaskDirective,
    DecimalPipe,
    ButtonWithLoaderComponent
  ],
  templateUrl: './iban-from-card-inquiry.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './iban-from-card-inquiry.component.scss'
})
export class IbanFromCardInquiryComponent {
  @Input() balance: number = 0;
  @Input() fee: number = 0;
  loading: boolean = false;
  inquiryResponse: any;
  form: FormGroup;
  card = new FormControl('',{validators: [Validators.required]});
  @Output() balanceChanged: EventEmitter<number> = new EventEmitter();
  private formBuilder = inject(FormBuilder);
  private utilityService = inject(UtilityService);
  private inquiryService = inject(InquiryService);
  public errorHandlingService = inject(ErrorHandlingService);
  private matSnackBar = inject(MatSnackBar);

  constructor() {
    this.form = this.formBuilder.group({
      card: this.card
    })
  }

  get isBalanceSufficient(): boolean {
    return Number(this.balance) >= Number(this.fee);
  }

  inquiry(){
    if (this.form.valid) {
      const formValue = this.form.value;
      let params = new FormData();
      params.append('card', formValue['card']);

      this.loading = true;

      this.inquiryService.ibanFromCard(params).subscribe({
        next: (response: any) => {
          this.inquiryResponse = response;

          this.balanceChanged.emit(response.balance);

          this.loading = false;
        },
        error: (error: any) => {
          this.loading = false;

          this.inquiryResponse = error.error;

          if (error.status == 422) {

            this.errorHandlingService.handleFormErrors(error, {
              card: this.card,
            });

            this.errorHandlingService.handleErrors(error, this);
          }
          else if (error.status == 429) {
            this.matSnackBar.open('تعداد درخواست‌های شما بیش از حد مجاز می‌باشد', 'باشه', {duration: 3000});
          }
          else {
            this.matSnackBar.open('خطا در برقراری ارتباط با سرور', 'باشه', {duration: 3000});
          }
        }
      })
    }
    else{
      Object.keys(this.form.controls).forEach(key => {
        this.form.get(key)!.markAsDirty();
      });
    }
  }

  public e2p = (value: unknown): string => this.utilityService.convertToEnglishNumbers(String(value).toUpperCase());
  protected readonly Number = Number;
}
