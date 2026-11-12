import {convertToEnglishNumbersUtil} from './convert-to-english-numbers.util';

/**
 * Normalize pasted/autofilled Iranian mobiles for mask prefix "0" + 10 digits.
 * Examples: +98 938 212 6008, 989382126008, 09382126008 → 9382126008
 */
export function normalizeIranianMobileInput(value: unknown): string {
  let phone = convertToEnglishNumbersUtil(String(value ?? ''));
  phone = phone.replace(/\D/g, '');

  if (phone.startsWith('0098')) {
    phone = phone.slice(4);
  } else if (phone.startsWith('98') && phone.length >= 12) {
    phone = phone.slice(2);
  }

  while (phone.startsWith('0')) {
    phone = phone.slice(1);
  }

  if (phone.length > 10) {
    phone = phone.slice(0, 10);
  }

  return phone;
}
