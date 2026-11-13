import {Component, ChangeDetectionStrategy, inject} from '@angular/core';
import {RouterOutlet} from "@angular/router";
import {DarkModeService} from '../../../services/dark-mode.service';

@Component({
  selector: 'app-auth-entry-layout',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './auth-entry-layout.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './auth-entry-layout.component.css',
})
export class AuthEntryLayoutComponent {
  readonly darkMode = inject(DarkModeService);
}
