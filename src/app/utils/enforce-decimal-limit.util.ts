export function enforceDecimalLimitUtil(value: string, limit: number, amountOfGoldToPay: string | null = null): string {
  if (! value) return '';

  // Use regex to match number with decimals
  const match = value.match(/^(\d{1,3}(,\d{3})*)?(\.\d{0,})?$/);
  if (! match)
  {
    if (amountOfGoldToPay) return amountOfGoldToPay;
    return '';
  }

  const [, integerPart = '', , decimalPart = ''] = match;

  if (decimalPart && decimalPart.length > limit + 1){
    return integerPart.replace(/,/g, '') + decimalPart.substring(0, limit+1);
  }

  return value.replace(/,/g, '');
}
