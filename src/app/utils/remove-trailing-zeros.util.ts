/**
 * حذف صفرهای اضافی از انتهای اعداد اعشاری
 * @param value - عدد یا رشته‌ای که باید پردازش شود
 * @returns عدد بدون صفرهای انتهایی
 * @example
 * removeTrailingZeros(10.500) // 10.5
 * removeTrailingZeros('12.3000') // 12.3
 * removeTrailingZeros(15.0) // 15
 */
export function removeTrailingZeros(value: number | string): number {
  // تبدیل عدد به رشته
  let numberString = value.toString();

  // حذف صفرهای اضافی در انتهای رشته
  numberString = numberString.replace(/(\.\d*?[1-9])0+$/, '$1');

  // اگر عدد پس از حذف صفرها به عدد صحیح تبدیل شود، حذف نقطه از انتهای عدد
  if (numberString.endsWith('.')) {
    numberString = numberString.slice(0, -1);
  }

  return parseFloat(numberString);
}
