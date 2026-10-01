import {PriceSource} from './price-source';
import {MetalItem} from './metal-item';

export interface SelectedMetalPrice {
  id: number,
  price_source_id: number,
  metal_item_id: number,
  metal_item: MetalItem,
  price_source: PriceSource | undefined,
  buy: number,
  sell: number,
  best_spot_buy?: number | string | null,
  time: string,
  created_at: string,
  updated_at: string,
}
