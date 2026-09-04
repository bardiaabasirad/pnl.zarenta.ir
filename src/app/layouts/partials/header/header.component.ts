import {ChangeDetectionStrategy, Component, effect, output} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {RouterLink} from '@angular/router';
import {map, timer} from 'rxjs';

import {Flowbite} from '../../../decorators/flowbite.decorator';
import {JalaliPipe} from '../../../pipes/jalali.pipe';
import {ContactComponent} from '../contact/contact.component';

@Flowbite()
@Component({
  selector: 'app-header',
  imports: [
    RouterLink,
    JalaliPipe,
    ContactComponent
  ],
  templateUrl: './header.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  readonly timeChanged = output<Date>();

  readonly rxTime = toSignal(
    timer(0, 1000).pipe(map(() => new Date())),
    {initialValue: new Date()}
  );

  constructor() {
    effect(() => this.timeChanged.emit(this.rxTime()));
  }
}
