import {PriceSource} from './price-source';

export interface PriceSourceMapping {
  id: number,
  price_source_id: number,
  metal_item_id: number,
  buy: string,
  buy_from_sell: string,
  sell: string,
  sell_from_buy: string,
  generate_buy_or_sell: number,
  price_source: PriceSource,
  created_at: string,
  updated_at: string,
}
