import {Component, inject} from '@angular/core';
import {ButtonWithLoaderComponent} from '../../../components/button-with-loader/button-with-loader.component';
import {AuthService} from '../../../services/auth.service';
import {AuthFlowService} from '../../../services/auth-flow.service';
import {Router} from '@angular/router';
import {MatSnackBar} from '@angular/material/snack-bar';

@Component({
  selector: 'app-rejected-request',
  imports: [
    ButtonWithLoaderComponent
  ],
  templateUrl: './rejected-request.component.html',
  styleUrl: './rejected-request.component.scss',
})
export class RejectedRequestComponent {
  private authService = inject(AuthService);
  private flow = inject(AuthFlowService);
  private router = inject(Router);
  private matSnackBar = inject(MatSnackBar);

  isSubmitting: boolean = false;

  onRequestReview(): void {
    const state = this.flow.getState();

    this.isSubmitting = true;

    this.authService.requestReview(state?.review_token).subscribe({
      next: data => {
        this.matSnackBar.open('درخواست بررسی مجدد شما ثبت شد', 'باشه', {duration: 5000})
        this.router.navigate(['/auth/pending']);
        this.isSubmitting = false;
      },
      error: err => {
        this.isSubmitting = false;
      }
    });
  }
}
