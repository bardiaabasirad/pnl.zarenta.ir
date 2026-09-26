import {Component, EventEmitter, inject, Input, Output, ChangeDetectionStrategy} from '@angular/core';
import {CommonModule} from '@angular/common';
import {InquiryService} from "../../../../services/inquiry.service";
import {ButtonWithLoaderComponent} from "../../../../components/button-with-loader/button-with-loader.component";
import {NgxMaskDirective} from "ngx-mask";
import {FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {nationalCodeValidator} from "../../../../validators/national-code-validator";
import {ErrorHandlingService} from "../../../../services/error-handling.service";
import {MatSnackBar} from "@angular/material/snack-bar";
import {convertToEnglishNumbersUtil} from '../../../../utils/convert-to-english-numbers.util';

@Component({
  selector: 'app-cra-inquiry',
  standalone: true,
  imports: [CommonModule, ButtonWithLoaderComponent, NgxMaskDirective, ReactiveFormsModule],
  templateUrl: './cra-inquiry.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./cra-inquiry.component.scss']
})
export class CraInquiryComponent {
  @Input() fee: number = 0;
  @Input() balance: number = 0;
  @Output() balanceChanged: EventEmitter<number> = new EventEmitter();
  inquiryResponse: any;
  loading: boolean = false;
  form: FormGroup;
  national_code = new FormControl('',{validators: [Validators.required, nationalCodeValidator]});
  phone = new FormControl('',{validators: [Validators.required]});
  // services
  private inquiryService = inject(InquiryService);
  private formBuilder = inject(FormBuilder);
  public errorHandlingService = inject(ErrorHandlingService);
  private snackBar = inject(MatSnackBar);

  constructor() {
    this.form = this.formBuilder.group({
      national_code: this.national_code,
      phone: this.phone,
    })
  }

  get isBalanceSufficient(): boolean {
    return Number(this.balance) >= Number(this.fee);
  }

  inquiry(){
    if (this.form.valid) {
      const formValue = this.form.value;
      let params = new FormData();
      params.append('national_code', formValue['national_code']);
      params.append('mobile_number', formValue['phone']);

      this.loading = true;
      this.inquiryService.matching(params).subscribe({
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
              national_code: this.national_code,
              phone: this.phone,
            });

            this.errorHandlingService.handleErrors(error, this);
          }
          else if (error.status == 429) {
            this.snackBar.open('تعداد درخواست‌های شما بیش از حد مجاز می‌باشد', 'باشه', {
              duration: 3000
            });
          }
          else {
            this.snackBar.open('خطا در برقراری ارتباط با سرور', 'باشه', {
              duration: 3000
            });
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

  public p2e = (value: unknown): string => convertToEnglishNumbersUtil(String(value));
  protected readonly Number = Number;
}
