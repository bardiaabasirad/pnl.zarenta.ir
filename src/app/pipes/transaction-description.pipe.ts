import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'transactionDescription',
  standalone: true
})
export class TransactionDescriptionPipe implements PipeTransform {

  // تابع کمکی برای جداکننده هزارگان
  private formatNumber(num: any): string {
    if (num === null || num === undefined || num === '') return '';

    // ابتدا مطمئن شو که عدد هست
    const number = +num;
    if (isNaN(number)) return String(num);

    // جدا کردن بخش صحیح و اعشاری
    const [integerPart, decimalPart] = number.toString().split('.');

    // اضافه کردن جداکننده هزارگان به بخش صحیح
    const formattedInt = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

    // در صورت وجود اعشار، ضمیمه‌اش می‌کنیم
    return decimalPart ? `${formattedInt}.${decimalPart}` : formattedInt;
  }

  transform(item: any): string {
    let text = '';

    if (item.ActionName) text += item.ActionName + ' ';
    if (item.Description) {
      // نگاشت عبارت‌های مورد نظر
      const map: { [key: string]: string } = {
        'سکه امامی': 'تمام سکه ۸۶',
        'سکه نیم': 'نیم سکه ۸۶',
        'سکه ربع': 'ربع سکه ۸۶',
        'سکه قدیم': 'تمام سکه قدیم',
      };

      let desc = item.Description;

      // جایگزینی همه‌ی موارد
      for (const [key, value] of Object.entries(map)) {
        // از regex با فلگ g استفاده می‌کنیم تا همه‌ی رخدادها جایگزین شوند
        desc = desc.replace(new RegExp(key, 'g'), value);
      }

      text += desc + ' ';
    }

    if (item.GoldPrice != null && item.GoldPrice !== '') {
      text += this.formatNumber(Math.round(item.GoldPrice / 10)) + ' ';
    }

    if (item.UnitPrice != null && item.UnitPrice != '' && item.UnitPrice != 0) {

      if (!['پرداخت', 'دریافت'].includes(item.ActionName) || ![15, 16, 17, 18].includes(item.CurrencyId)) {
        const unitPriceToman = Math.round(item.UnitPrice / 10);
        text += `فی ${this.formatNumber(unitPriceToman)} تومان `;
      }

      if (item.Quantity != null && item.Quantity !== '' && item.Quantity !== 0) {
        text += 'تعداد ' + this.formatNumber(Math.abs(item.Quantity)) + ' ';
      }
    }

    if(item.Fineness && item.Fineness != 750 && item.ProductId == 2){
      text += Math.abs(Math.round((item.Weight750 / item.Weight) * 750)) + 'K';
    }
    else if(item.Fineness && item.Fineness != 750) {
      text += item.Fineness + 'K';
    }

    // else if (item.Fineness && item.Fineness != 750) text += item.Fineness + 'K';
    // else if (
    //   item.Fineness &&
    //   item.Weight &&
    //   item.Weight750 &&
    //   item.Fineness == 750 &&
    //   item.Fineness != Math.round((item.Weight750 / item.Weight) * 750)
    // )
    // {
    //     text += Math.abs(Math.round((item.Weight750 / item.Weight) * 750)) + 'K';
    // }

    return text.trim();
  }

}
