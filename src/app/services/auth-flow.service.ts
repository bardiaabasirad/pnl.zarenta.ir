import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthFlowService {

  private STORAGE_KEY = 'auth_flow';

  setState(data: any) {
    sessionStorage.setItem(
      this.STORAGE_KEY,
      JSON.stringify(data)
    );
  }

  getState() {
    const raw = sessionStorage.getItem(this.STORAGE_KEY);

    return raw ? JSON.parse(raw) : null;
  }

  clear() {
    sessionStorage.removeItem(this.STORAGE_KEY);
  }
}
