import { Injectable } from '@angular/core';
import Cookies from 'js-cookie';
import {environment} from '../../environments/environment';

export const StorageKey = {
  ACCESS_TOKEN: environment.access_token,
  DARK_MODE: environment.dark_mode,
} as const;

export type StorageKeyType = typeof StorageKey[keyof typeof StorageKey];

@Injectable({
  providedIn: 'root'
})
export class StorageService {

  constructor() { }

  static get(name: string, asJson: boolean = false): string | null {
    try {
      return asJson ? JSON.parse(localStorage.getItem(name) as string) : localStorage.getItem(name);
    } catch (error) {
      return null;
    }
  }

  static set(name: string, value: any): void {
    localStorage.setItem(name, value);
  }

  static remove(name: string): void {
    localStorage.removeItem(name);
  }

  static getCookie(name: StorageKeyType): string | undefined {
    return Cookies.get(name);
  }

  static setCookie(name: StorageKeyType, value: string, expires?: any): string | undefined {
    return Cookies.set(name, value, {
      expires: expires || 365,
      secure: environment.production,
      sameSite: 'Strict'
    });
  }

  static removeCookie(name: StorageKeyType): void {
    return Cookies.remove(name);
  }

}
