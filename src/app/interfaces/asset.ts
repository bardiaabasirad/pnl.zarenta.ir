import {MetalItem} from './metal-item';

export interface Asset {
  id: number,
  metal_trader_id: number,
  metal_item_id: number,
  metal_item: MetalItem | null,
  avg_buy_price: number,
  available_balance: number,
  blocked_balance: number,
  fiat_balance: number,
  total_balance: number,
  created_at: string,
  updated_at: string
}
