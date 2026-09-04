import { isPlatformServer } from '@angular/common';
import {
  Directive,
  ElementRef,
  Inject,
  Input,
  OnChanges,
  PLATFORM_ID,
  Renderer2,
  SimpleChanges,
} from '@angular/core';

type ImageSrc = string | null | undefined;

@Directive({
  selector: '[appDefaultImg]',
  standalone: true,
})
export class DefaultImgDirective implements OnChanges {
  @Input({ required: true }) src: ImageSrc = null;

  private defaultLocalImage = '/assets/images/theme/gallery-icon-picture-landscape-vector-sign-symbol_660702-313.jpg';

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private imageRef: ElementRef,
    private renderer: Renderer2
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    this.initImage();
  }

  private initImage() {
    // do not evaluate on SSR
    if (isPlatformServer(this.platformId)) {
      return;
    }

    const img = new Image();

    // return on no src
    if (!this.src) {
      return;
    }

    // if possible to load image, set it to img
    img.onload = () => {
      this.setImage(this.resolveImage(this.src));
    };

    img.onerror = () => {
      // Set a placeholder image
      this.setImage(this.defaultLocalImage);
    };

    // triggers http request to load image
    img.src = this.resolveImage(this.src);
  }

  private setImage(src: ImageSrc) {
    this.imageRef.nativeElement.setAttribute('src', src);
  }

  private resolveImage(src: ImageSrc): string {
    if (!src) {
      return this.defaultLocalImage;
    }

    return src;
  }
}
