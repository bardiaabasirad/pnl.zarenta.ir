import {Component, ChangeDetectionStrategy} from '@angular/core';
import {RouterOutlet} from "@angular/router";

@Component({
  selector: 'app-auth-entry-layout',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './auth-entry-layout.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './auth-entry-layout.component.scss',
})
export class AuthEntryLayoutComponent {

}
