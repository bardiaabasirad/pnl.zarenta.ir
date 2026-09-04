import {EventEmitter, Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class EventService {

  public cartUpdateEvent: EventEmitter<void> = new EventEmitter<void>();
  public userUpdateEvent: EventEmitter<void> = new EventEmitter<void>();
  public priceUpdateEvent: EventEmitter<void> = new EventEmitter<void>();
  public canNotUpdateMarketPriceEvent: EventEmitter<void> = new EventEmitter<void>();

  constructor() { }

}
