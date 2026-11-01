import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  forwardRef,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Dropdown, DropdownInterface, DropdownOptions, InstanceOptions } from 'flowbite';

let nextDropdownSelectId = 0;

@Component({
  selector: 'app-dropdown-select',
  standalone: true,
  templateUrl: './dropdown-select.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block w-full',
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DropdownSelect),
      multi: true,
    },
  ],
})
export class DropdownSelect implements ControlValueAccessor {
  readonly options = input<readonly unknown[]>([]);
  readonly bindLabel = input<string>('label');
  readonly bindValue = input<string | null>(null);
  readonly placeholder = input<string>('لطفا انتخاب کنید');
  readonly triggerClass = input<string>('');

  readonly buttonId = `dropdown-select-btn-${++nextDropdownSelectId}`;
  readonly menuId = `dropdown-select-menu-${nextDropdownSelectId}`;

  readonly disabled = signal(false);
  readonly value = signal<unknown>(null);

  readonly selectedOption = computed(() => {
    const current = this.value();
    return this.options().find((option) => this.valuesEqual(this.optionValue(option), current));
  });

  readonly selectedLabel = computed(() => {
    const selected = this.selectedOption();
    return selected == null ? null : this.optionLabel(selected);
  });

  private readonly triggerEl = viewChild<ElementRef<HTMLButtonElement>>('trigger');
  private readonly menuEl = viewChild<ElementRef<HTMLDivElement>>('menu');
  private readonly hostEl = inject(ElementRef<HTMLElement>);
  private dropdown: DropdownInterface | null = null;

  private onChange: (value: unknown) => void = () => {};
  private onTouched: () => void = () => {};

  constructor() {
    afterNextRender(() => this.initDropdown());

    inject(DestroyRef).onDestroy(() => {
      this.dropdown?.destroyAndRemoveInstance();
      this.dropdown = null;
    });
  }

  writeValue(value: unknown): void {
    this.value.set(value ?? null);
  }

  registerOnChange(fn: (value: unknown) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  optionLabel(option: unknown): string {
    if (option == null) {
      return '';
    }

    if (typeof option !== 'object') {
      return String(option);
    }

    const label = (option as Record<string, unknown>)[this.bindLabel()];
    return label == null ? '' : String(label);
  }

  optionValue(option: unknown): unknown {
    const key = this.bindValue();
    if (!key || option == null || typeof option !== 'object') {
      return option;
    }

    return (option as Record<string, unknown>)[key];
  }

  isSelected(option: unknown): boolean {
    return this.valuesEqual(this.optionValue(option), this.value());
  }

  select(option: unknown): void {
    if (this.disabled()) {
      return;
    }

    const nextValue = this.optionValue(option);
    this.value.set(nextValue ?? null);
    this.onChange(nextValue ?? null);
    this.onTouched();
    this.dropdown?.hide();
  }

  private initDropdown(): void {
    const trigger = this.triggerEl()?.nativeElement;
    const menu = this.menuEl()?.nativeElement;

    if (!trigger || !menu) {
      return;
    }

    // خارج از overflow جدول/کانتینر تا باز شدن منو اسکرول ایجاد نکند
    document.body.appendChild(menu);

    const options: DropdownOptions = {
      placement: 'bottom-start',
      triggerType: 'click',
      offsetSkidding: 0,
      offsetDistance: 8,
      onShow: () => {
        menu.style.width = `${this.hostEl.nativeElement.offsetWidth}px`;
      },
      onHide: () => {
        this.onTouched();
      },
    };

    const instanceOptions: InstanceOptions = {
      id: this.menuId,
      override: true,
    };

    this.dropdown = new Dropdown(menu, trigger, options, instanceOptions);
  }

  private valuesEqual(a: unknown, b: unknown): boolean {
    if (a === b) {
      return true;
    }

    if (a == null || b == null) {
      return a == b;
    }

    return String(a) === String(b);
  }
}
