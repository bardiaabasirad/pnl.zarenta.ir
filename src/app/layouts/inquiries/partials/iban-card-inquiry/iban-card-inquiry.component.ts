import {Component, ElementRef, EventEmitter, inject, Input, OnDestroy, OnInit, Output, ViewChild, ChangeDetectionStrategy} from '@angular/core';
import {FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {InquiryService} from '../../../../services/inquiry.service';
import {ErrorHandlingService} from '../../../../services/error-handling.service';
import {MatSnackBar} from '@angular/material/snack-bar';
import {NgxMaskDirective} from 'ngx-mask';
import { CommonModule, DecimalPipe } from '@angular/common';
import {ButtonWithLoaderComponent} from '../../../../components/button-with-loader/button-with-loader.component';
import {Subscription} from 'rxjs';
import {convertToEnglishNumbersUtil} from '../../../../utils/convert-to-english-numbers.util';

@Component({
  selector: 'app-iban-card-inquiry',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NgxMaskDirective,
    DecimalPipe,
    ButtonWithLoaderComponent
  ],
  templateUrl: './iban-card-inquiry.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './iban-card-inquiry.component.scss'
})
export class IbanCardInquiryComponent implements OnInit, OnDestroy {
  @Input() balance: number = 0;
  @Input() fee: number = 0;
  loading: boolean = false;
  inquiryResponse: any;
  form: FormGroup;
  iban = new FormControl('',{validators: [Validators.required]});
  @Output() balanceChanged: EventEmitter<number> = new EventEmitter();
  @ViewChild('cardInput') cardInput!: ElementRef<HTMLInputElement>;
  private valueChangesSub!: Subscription;
  currentMask: string = '';
  private formBuilder = inject(FormBuilder);
  private inquiryService = inject(InquiryService);
  public errorHandlingService = inject(ErrorHandlingService);
  private matSnackBar = inject(MatSnackBar);

  constructor() {
    this.form = this.formBuilder.group({
      iban: this.iban
    })
  }

  ngOnInit() {
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

    // On some devices, the mask is applied after the blur event and then the focus event.
    this.cardInput.nativeElement.blur();
    this.cardInput.nativeElement.focus();

    setTimeout(() => {
      this.iban.updateValueAndValidity({ emitEvent: false });
    }, 0)
  }

  inquiry(){
    if (this.form.valid) {
      const formValue = this.form.value;
      let params = new FormData();
      params.append('iban', formValue['iban']);

      this.loading = true;

      this.inquiryService.iban(params).subscribe({
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
              iban: this.iban,
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

  public p2e = (value: unknown): string => convertToEnglishNumbersUtil(String(value));
  protected readonly Number = Number;
}
