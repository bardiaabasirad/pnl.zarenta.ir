import {MetalItemGroup} from './metal-item-group';
import {SelectedMetalPrice} from './selected-metal-price';
import {PriceSourceMapping} from './price-source-mapping';

export interface MetalItem {
  id: number,
  is_buy_active: boolean,
  is_sell_active: boolean,
  is_spot: boolean,
  metal_item_group_id: boolean,
  price_change_threshold: number,
  buy_sell_spread: number,
  settlement_working_days: number,
  group: MetalItemGroup,
  price_source_mapping: PriceSourceMapping,
  latest_price: SelectedMetalPrice,
  pivot: any,
  purity: number,
  title: string,
  unit: string,
  created_at: string,
  updated_at: string
}
