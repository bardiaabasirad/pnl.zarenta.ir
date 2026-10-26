import {AppConstants} from '../constants/app-constants';

/**
 * Display = Base × (targetMultiplier / sourceMultiplier)
 */
export function convertMetalPrice(
  price: number,
  sourceUnitId: string,
  targetUnitId: string
): number {
  if (sourceUnitId === targetUnitId) {
    return price;
  }

  const source = AppConstants.UNIT_MULTIPLIER_TO_GRAM[sourceUnitId];
  const target = AppConstants.UNIT_MULTIPLIER_TO_GRAM[targetUnitId];

  if (!source || !target) {
    return price;
  }

  return price * (target / source);
}

export function resolveTargetUnitId(config: any): string {
  if (config?.target_unit_id) {
    return config.target_unit_id;
  }

  // zhikgold: per_gram → gram; zarenta legacy: quotation → mazane, else → gram
  if (config?.display_mode === 'per_gram') {
    return 'gram';
  }
  if (config?.display_mode === 'quotation') {
    return 'mazane';
  }
  if (config?.display_mode) {
    return 'gram';
  }

  return 'mazane';
}

export function resolvePricingUnitId(metalItem: any): string {
  return metalItem?.pricing_unit_id
    ?? metalItem?.pricing_unit_basis
    ?? 'mazane';
}

export function isGramTarget(config: any): boolean {
  return resolveTargetUnitId(config) === 'gram';
}

export function isMazaneTarget(config: any): boolean {
  return resolveTargetUnitId(config) === 'mazane';
}

export function unitLabel(unitId: string): string {
  switch (unitId) {
    case 'gram':
      return 'گرم';
    case 'mazane':
      return 'مظنه';
    case 'count':
      return 'عدد';
    case 'kilogram':
      return 'کیلوگرم';
    case 'ounce':
      return 'انس';
    case 'ton':
      return 'تن';
    default:
      return unitId;
  }
}
