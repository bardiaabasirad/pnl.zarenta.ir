import {Component, input, output, model, ChangeDetectionStrategy} from '@angular/core';


@Component({
  selector: 'app-custom-checkbox',
  templateUrl: './custom-checkbox.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [],
})
export class CustomCheckboxComponent {
  // Input signals - فقط خواندنی
  trueValue = input<string>('active');
  falseValue = input<string>('inactive');
  activeText = input<string>('فعال');
  inactiveText = input<string>('غیرفعال');

  // Model signal - دو طرفه (برای ngModel)
  value = model<string>();

  // Output signal
  onChanged = output<boolean>();

  // Computed signal برای وضعیت چک بودن
  isChecked = () => this.value() === this.trueValue();

  // متد تغییر وضعیت checkbox
  onCheckboxChange(checked: boolean): void {
    const newValue = checked ? this.trueValue() : this.falseValue();
    this.value.set(newValue);
    this.onChanged.emit(checked);
  }

  // متد برای تغییر وضعیت با کلیک
  toggle(): void {
    this.onCheckboxChange(!this.isChecked());
  }
}
