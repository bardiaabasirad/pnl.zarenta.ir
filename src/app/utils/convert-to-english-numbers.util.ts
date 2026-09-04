export function convertToEnglishNumbersUtil(number: string): string {
  const persianArabicToEnglishMap: any = {
    '۰': '0',
    '۱': '1',
    '۲': '2',
    '۳': '3',
    '۴': '4',
    '۵': '5',
    '۶': '6',
    '۷': '7',
    '۸': '8',
    '۹': '9',
  };

  // Convert Persian/Arabic digits to English digits
  let result = number.replace(/[۰-۹]/g, (match) => persianArabicToEnglishMap[match]);
  // Remove non-numeric characters except decimal point
  result = result.replace(/[^0-9.]/g, '');
  return result;
}
