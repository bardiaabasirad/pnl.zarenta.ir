/**
 * انواع روش‌های گرد کردن مجاز
 */
export type RoundingDirection = 'ceil' | 'floor' | 'round' | 'trunc';

export interface RoundToStepOptions {
  /**
   * گام گرد کردن (پیش‌فرض: 1000)
   */
  step?: number;
  /**
   * جهت گرد کردن:
   * - boolean: اگر true باشد معادل 'ceil' (خرید)، اگر false باشد معادل 'floor' (فروش)
   * - string: یکی از متدهای 'ceil' | 'floor' | 'round' | 'trunc'
   */
  direction: boolean | RoundingDirection;
}

/**
 * عدد را بر اساس یک Step مشخص (مثل ۱۰۰۰) به بالا، پایین یا نزدیک‌ترین گرد می‌کند.
 *
 * @param value مقدار عددی ورودی
 * @param directionOrOptions
 * @param step گام اختیاری در صورتی که پارامتر دوم ساده پاس داده شود (پیش‌فرض: 1000)
 * @returns عدد گرد شده نهایی
 *
 * @example
 * roundToStep(1250, true); // 2000
 * roundToStep(1250, false); // 1000
 * roundToStep(1250, { direction: 'round', step: 500 }); // 1500
 */
export function roundToStep(
  value: number,
  directionOrOptions: boolean | RoundingDirection | RoundToStepOptions,
  step: number = 1000
): number {
  // ۱. اعتبارسنجی مقادیر نامعتبر
  if (value === null || value === undefined || isNaN(value) || !isFinite(value)) {
    return 0;
  }

  // ۲. نرمال‌سازی آرگومان‌ها
  let finalStep = step;
  let method: RoundingDirection;

  if (typeof directionOrOptions === 'object' && directionOrOptions !== null) {
    finalStep = directionOrOptions.step ?? 1000;
    const dir = directionOrOptions.direction;
    method = typeof dir === 'boolean' ? (dir ? 'ceil' : 'floor') : dir;
  } else if (typeof directionOrOptions === 'boolean') {
    method = directionOrOptions ? 'ceil' : 'floor';
  } else {
    method = directionOrOptions;
  }

  // گام باید عددی مثبت و غیر صفر باشد
  if (finalStep <= 0) {
    throw new Error(`[roundToStep] Step must be a positive number greater than 0. Received: ${finalStep}`);
  }

  // ۳. حل مشکل Floating-Point Precision
  // مقیاس‌بندی اولیه
  const scaled = value / finalStep;

  // فاکتور تصحیح اپسیلون برای جلوگیری از پرش‌های ناخواسته ceil/floor روی اعشارهای 0.000000000000000x
  const eps = 1e-12;
  let normalizedScaled = scaled;

  if (method === 'ceil') {
    // اگر اختلاف با عدد صحیح قبلی کمتر از اپسیلون بود، اصلاح می‌شود تا ceil نپرد
    if (Math.ceil(scaled) - scaled < eps) {
      normalizedScaled = Math.ceil(scaled);
    }
  } else if (method === 'floor') {
    // اگر عدد فقط با یک اپسیلون ناچیز کمتر از اینتیجر بود، اصلاح می‌شود
    if (scaled - Math.floor(scaled) > 1 - eps) {
      normalizedScaled = Math.ceil(scaled);
    }
  }

  // ۴. اعمال متد ریاضی و برگرداندن به مقیاس اصلی
  const roundedScaled = Math[method](normalizedScaled);

  // ضرب نهایی و گرد کردن اعشار سرگردان جاوااسکریپت در ضرب اعشاری
  return Number(Math.round(Number((roundedScaled * finalStep) + 'e12')) + 'e-12');
}
