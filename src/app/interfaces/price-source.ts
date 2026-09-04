import {MetalItem} from './metal-item';

export interface PriceSource {
  id: number,
  name: string,
  metal_items_count: string,
  metal_items: MetalItem[],
  created_at: string,
  updated_at: string
}
