import { Injectable } from '@angular/core';
import * as CryptoJS from 'crypto-js';
import { environment } from '../../environments/environment';

export interface EncryptedData {
  data: string;
  iv: string;
}

@Injectable({
  providedIn: 'root'
})
export class EncryptionService {
  private readonly key: CryptoJS.lib.WordArray;

  constructor() {
    // 👈 Latin1 استفاده کنید، نه Utf8
    // Latin1 هر بایت کاراکتر را دقیقاً به صورت خودش نگه می‌دارد
    this.key = CryptoJS.enc.Latin1.parse(environment.encryptionKey);
  }

  encrypt(data: any): EncryptedData {
    const jsonData = JSON.stringify(data);
    const iv = CryptoJS.lib.WordArray.random(16);

    const encrypted = CryptoJS.AES.encrypt(jsonData, this.key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });

    return {
      data: encrypted.toString(),  // خودش Base64 می‌کند
      iv: CryptoJS.enc.Base64.stringify(iv)
    };
  }

  decrypt(encryptedData: string, ivString: string): any {
    if (!encryptedData || !ivString) {
      throw new Error('encryptedData یا IV خالی است');
    }

    const iv = CryptoJS.enc.Base64.parse(ivString);

    const decrypted = CryptoJS.AES.decrypt(encryptedData, this.key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });

    const decryptedStr = decrypted.toString(CryptoJS.enc.Utf8);

    if (!decryptedStr) {
      throw new Error('رمزگشایی ناموفق - کلید یا IV نامتجانس است');
    }

    return JSON.parse(decryptedStr);
  }
}
