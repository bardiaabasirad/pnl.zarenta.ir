import {PriceSource} from './price-source';

export interface SelectedMetalPrice {
  id: number,
  price_source_id: number,
  metal_item_id: number,
  price_source: PriceSource | undefined,
  buy: number,
  sell: number,
  time: string,
  created_at: string,
  updated_at: string,
}
