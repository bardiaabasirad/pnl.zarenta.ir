import {MetalItem} from './metal-item';

export interface MetalItemGroup {
  id: number,
  title: string,
  metal_items_count: number,
  metal_items: MetalItem[],
  created_at: string,
  updated_at: string
}
