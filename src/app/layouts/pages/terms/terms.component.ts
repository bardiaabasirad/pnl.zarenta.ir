import {ChangeDetectionStrategy, Component, inject, OnInit, signal} from '@angular/core';
import {DomSanitizer, SafeHtml, Title} from '@angular/platform-browser';
import {Location} from '@angular/common';
import {ActivatedRoute, Router} from '@angular/router';
import {PageService} from '../../../services/page.service';
import {Page} from '../../../interfaces/page';
import {environment} from '../../../../environments/environment';

@Component({
  selector: 'app-terms',
  templateUrl: './terms.component.html',
  styleUrl: './terms.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TermsComponent implements OnInit {
  private pageService = inject(PageService);
  private sanitizer = inject(DomSanitizer);
  private title = inject(Title);
  private location = inject(Location);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  readonly environment = environment;
  readonly standalone = this.route.snapshot.data['standalone'] === true;
  readonly initialized = signal(false);
  readonly page = signal<Page | null>(null);
  readonly safeBody = signal<SafeHtml | null>(null);

  /** Angular increments navigationId on each in-app navigation; 1 means first entry. */
  private readonly canGoBack =
    ((this.location.getState() as {navigationId?: number} | null)?.navigationId ?? 1) > 1;

  ngOnInit(): void {
    this.pageService.terms().subscribe({
      next: (page) => {
        this.page.set(page);
        this.safeBody.set(this.sanitizer.bypassSecurityTrustHtml(page.body ?? ''));
        this.title.setTitle(`${page.title} | ${environment.appTitle}`);
        this.initialized.set(true);
      },
      error: () => {
        this.initialized.set(true);
      },
    });
  }

  back(): void {
    if (this.canGoBack) {
      this.location.back();
      return;
    }

    void this.router.navigateByUrl('/');
  }
}
