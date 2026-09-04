import {
  afterNextRender,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
  signal,
  viewChild,
} from '@angular/core';
import type { Swiper, SwiperOptions } from 'swiper/types';

type SwiperEl = HTMLElement & {
  initialize: () => void;
  swiper: Swiper;
};

@Component({
  selector: 'app-testimonial-slider',
  imports: [],
  templateUrl: './testimonial-slider.component.html',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class TestimonialSliderComponent {
  readonly items: any[] = [
    {
      id: 1,
      name: 'سارا محمدی',
      role: 'مشتری ژیک',
      avatar: '/assets/avatars/1.jpg',
      comment: 'امنیت و اعتماد، برای من خیلی مهمه. ژیک دقیقاً همون چیزی بود که دنبالش بودم.',
    },
    {
      id: 2,
      name: 'امیر رضایی',
      role: 'مشتری ژیک',
      avatar: '/assets/avatars/2.jpg',
      comment: 'با ژیک، خرید و فروش طلا به ساده‌ترین شکل ممکن انجام می‌شه. سرعت بالای بی‌نظیر!',
    },
    {
      id: 3,
      name: 'نگار کریمی',
      role: 'مشتری ژیک',
      avatar: '/assets/avatars/3.jpg',
      comment: 'رابط کاربری تمیز و بدون پیچیدگی، حتی برای کاربر تازه‌کار قابل استفاده است.',
    },
    {
      id: 4,
      name: 'محمد نعمتی',
      role: 'مشتری ژیک',
      avatar: '/assets/avatars/3.jpg',
      comment: 'پشتیبانی سریع و پاسخگو، هر سوالی داشتم در کمترین زمان جواب گرفتم. واقعاً حرفه‌ای عمل می‌کنن.',
    },
  ];

  private readonly swiperRef = viewChild.required<ElementRef<SwiperEl>>('swiper');
  private swiper?: Swiper;

  /** وضعیت لبه‌ها برای disable کردن دکمه‌ها */
  readonly isBeginning = signal(true);
  readonly isEnd = signal(false);
  readonly activeIndex = signal(0);

  constructor() {
    afterNextRender(() => void this.setup());
  }

  private async setup(): Promise<void> {
    if (!customElements.get('swiper-container')) {
      const { register } = await import('swiper/element/bundle');
      register();
    }

    const el = this.swiperRef().nativeElement;

    const params: SwiperOptions = {
      slidesPerView: 1.2,
      slidesOffsetBefore: 10,
      slidesOffsetAfter: 10,
      spaceBetween: 0,
      grabCursor: true,
      autoHeight: true,
      speed: 600,
      autoplay: { delay: 5000, disableOnInteraction: false },
      keyboard: { enabled: true },
      navigation: false,   // ← ناوبری داخلی خاموش
      pagination: false,   // ← pagination حذف می‌شود
      breakpoints: {
        768: {
          slidesPerView: 2,
          slidesOffsetBefore: 0,
          slidesOffsetAfter: 0,
          spaceBetween: 0,
        },
        1280: {
          slidesPerView: 3,
          slidesOffsetBefore: 0,
          slidesOffsetAfter: 0,
          spaceBetween: 0,
        },
      }
    };

    Object.assign(el, params);

    // رخدادهای المان وب برای سینک وضعیت دکمه‌ها
    const sync = (e: Event) => {
      const [s] = (e as CustomEvent<[Swiper]>).detail ?? [];
      this.syncState(s ?? el.swiper);
    };

    for (const name of [
      'swiperinit',
      'swiperslidechange',
      'swiperresize',
      'swiperbreakpoint',
      'swiperupdate',
      'swipertoedge',
      'swiperfromedge',
    ]) {
      el.addEventListener(name, sync);
    }

    el.initialize();
    this.swiper = el.swiper;
    this.syncState(this.swiper);
  }

  private syncState(s?: Swiper): void {
    if (!s) return;
    this.isBeginning.set(s.isBeginning);
    this.isEnd.set(s.isEnd);
    this.activeIndex.set(s.activeIndex);
  }

  prev(): void {
    this.swiper?.slidePrev();
  }

  next(): void {
    this.swiper?.slideNext();
  }

  goTo(index: number): void {
    this.swiper?.slideTo(index);
  }

  stars(rating: number): number[] {
    return Array.from({ length: 5 }, (_, i) => (i < rating ? 1 : 0));
  }
}
