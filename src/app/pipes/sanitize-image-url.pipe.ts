import {inject, Pipe, PipeTransform} from '@angular/core';
import {DomSanitizer} from '@angular/platform-browser';
import {environment} from '../../environments/environment';

@Pipe({
  name: 'sanitizeImageURL',
  standalone: true
})
export class SanitizeImageURLPipe implements PipeTransform {

  private sanitizer = inject(DomSanitizer);

  transform(path: string | null | undefined, w: string = '100', h: string = '100'): unknown {
    if (!path) {
      return null;
    }

    const imageUrl = `${environment.apiUrl}/v1/images/${path}?w=${w}&h=${h}`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(imageUrl);
  }
}
