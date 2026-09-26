import {Component, EventEmitter, inject, Input, OnDestroy, OnInit, Output, ViewChild, ChangeDetectionStrategy} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import {InquiryService} from "../../../../services/inquiry.service";
import {FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators} from "@angular/forms";
import {ErrorHandlingService} from "../../../../services/error-handling.service";
import {MatSnackBar} from "@angular/material/snack-bar";
import {ButtonWithLoaderComponent} from "../../../../components/button-with-loader/button-with-loader.component";
import {DatePickerComponent} from "../../../../components/date-picker/date-picker.component";
import {NgxMaskDirective} from "ngx-mask";
import {nationalCodeValidator} from "../../../../validators/national-code-validator";
import {Subscription} from "rxjs";
import moment from "jalali-moment";
import {convertToEnglishNumbersUtil} from '../../../../utils/convert-to-english-numbers.util';

@Component({
  selector: 'app-bank-inquiry',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ButtonWithLoaderComponent, DatePickerComponent, NgxMaskDirective],
  templateUrl: './bank-inquiry.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./bank-inquiry.component.scss']
})
export class BankInquiryComponent implements OnInit, OnDestroy {
  @Input() fee: number = 0;
  @Input() balance: number = 0;
  @Output() balanceChanged: EventEmitter<number> = new EventEmitter();
  @ViewChild(DatePickerComponent) datePicker!: DatePickerComponent;
  inquiryResponse: any;
  loading: boolean = false;
  form: FormGroup;
  national_code = new FormControl('',{validators: [Validators.required, nationalCodeValidator]});
  birthdate = new FormControl('',{validators: [Validators.required]});
  iban = new FormControl('',{validators: [Validators.required]});
  private valueChangesSub!: Subscription;
  currentMask: string = '';

  private inquiryService = inject(InquiryService);
  private formBuilder = inject(FormBuilder);
  public errorHandlingService = inject(ErrorHandlingService);
  private snackBar = inject(MatSnackBar);
  private datePipe = inject(DatePipe);

  constructor() {
    this.form = this.formBuilder.group({
      national_code: this.national_code,
      birthdate: this.birthdate,
      iban: this.iban
    })
  }

  ngOnInit(): void {
    this.valueChangesSub = this.iban.valueChanges.subscribe(value => {
      this.updateMask();
    });
  }

  ngOnDestroy() {
    if (this.valueChangesSub){
      this.valueChangesSub.unsubscribe();
    }
  }

  get isBalanceSufficient(): boolean {
    return Number(this.balance) >= Number(this.fee);
  }

  updateMask() {
    if (this.iban.value) {
      const value = this.iban.value?.toUpperCase();
      const digitRegex = /^\d/;
      const letterRegex = /^[A-Z]/i; // Starts with a letter

      if (letterRegex.test(value)) {
        // First character is a letter (string)
        this.currentMask = 'SS00 0000 0000 0000 0000 0000 00'; // IBAN format
      } else if (digitRegex.test(value) && value.length > 0 && value.length <= 16) {
        // First character is a digit
        this.currentMask = '0000-0000-0000-0000'; // Card format
      }
    } else {
      this.currentMask = '';
    }

    setTimeout(() => {
      this.iban.updateValueAndValidity({ emitEvent: false });
    }, 0)
  }

  inquiry(){
    if (this.form.valid) {
      const formValue = this.form.value;
      let params = new FormData();
      params.append('national_code', formValue['national_code']);
      const birthdate = moment(formValue['birthdate'], 'YYYY-MM-DD').locale('fa').format('YYYYMMDD');
      params.append('birthdate', birthdate);
      if (formValue['iban'].includes('IR')) {
        params.append('iban', formValue['iban']);
      }
      else{
        params.append('card_number', formValue['iban']);
      }

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
              birthdate: this.birthdate,
              iban: this.iban,
            });

            this.errorHandlingService.handleErrors(error, this);
          }
          else if (error.status == 429) {
            this.snackBar.open('تعداد درخواست‌های شما بیش از حد مجاز می‌باشد', 'باشه', {duration: 3000});
          }
          else {
            this.snackBar.open('خطا در برقراری ارتباط با سرور', 'باشه', {duration: 3000});
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

  datePicked(date: Date){
    if (date) {
      const formattedDate = this.datePipe.transform(date, 'yyyy-MM-dd');
      this.birthdate.setValue(formattedDate ?? '');
    }
  }

  resetDatePicker() {
    this.datePicker.resetDate();
  }

  public p2e = (value: unknown): string => convertToEnglishNumbersUtil(String(value));

  protected readonly Number = Number;
}
