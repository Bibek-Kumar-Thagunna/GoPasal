export type StoreDeliveryChargeMeta = {
  deliveryFee?: number | string;
  freeDeliveryThreshold?: number | string;
  freeDelivery?: boolean;
};

export function readStoreDeliveryCharges(metadata: unknown): {
  deliveryFeeText: string;
  freeDeliveryThresholdText: string;
  alwaysFreeDelivery: boolean;
} {
  if (!metadata || typeof metadata !== 'object') {
    return { deliveryFeeText: '', freeDeliveryThresholdText: '', alwaysFreeDelivery: false };
  }
  const m = metadata as StoreDeliveryChargeMeta;
  if (m.freeDelivery === true) {
    return { deliveryFeeText: '0', freeDeliveryThresholdText: '', alwaysFreeDelivery: true };
  }
  const fee = m.deliveryFee != null ? String(m.deliveryFee) : '';
  const threshold =
    m.freeDeliveryThreshold != null && Number(m.freeDeliveryThreshold) > 0
      ? String(m.freeDeliveryThreshold)
      : '';
  return {
    deliveryFeeText: fee,
    freeDeliveryThresholdText: threshold,
    alwaysFreeDelivery: false,
  };
}

export function buildDeliveryChargesPayload(input: {
  deliveryFeeText: string;
  freeDeliveryThresholdText: string;
  alwaysFreeDelivery: boolean;
  pickupOnly: boolean;
}): Record<string, unknown> | null {
  if (input.pickupOnly) return null;

  if (input.alwaysFreeDelivery) {
    return { freeDelivery: true, deliveryFee: 0 };
  }

  const feeRaw = input.deliveryFeeText.trim();
  if (!feeRaw) {
    return { clearDeliveryCharges: true };
  }

  const fee = parseFloat(feeRaw);
  if (!Number.isFinite(fee) || fee < 0) {
    return { invalid: true };
  }

  const thresholdRaw = input.freeDeliveryThresholdText.trim();
  let freeDeliveryThreshold: number | undefined;
  if (thresholdRaw) {
    const threshold = parseFloat(thresholdRaw);
    if (!Number.isFinite(threshold) || threshold <= 0) {
      return { invalid: true };
    }
    freeDeliveryThreshold = threshold;
  }

  return {
    freeDelivery: false,
    deliveryFee: fee,
    ...(freeDeliveryThreshold != null ? { freeDeliveryThreshold } : {}),
  };
}

export type DeliveryChargesPayloadResult =
  | { invalid: true }
  | { clearDeliveryCharges: true }
  | { freeDelivery: true; deliveryFee: number }
  | { freeDelivery: false; deliveryFee: number; freeDeliveryThreshold?: number };
