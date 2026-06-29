export type FulfillmentType = 'shipping' | 'delivery' | 'pickup';

export interface FulfillmentInfo {
  type: FulfillmentType;
  name: string;
}

/**
 * Parses raw courier_name from DB to extract fulfillment type and provider name.
 * Handles prefixed names (e.g. "delivery:Grab Express") and legacy names for backward compatibility.
 */
export function parseCourierName(rawName?: string | null): FulfillmentInfo {
  if (!rawName) {
    return { type: 'shipping', name: '' };
  }

  const trimmed = rawName.trim();

  if (trimmed.startsWith('shipping:')) {
    return { type: 'shipping', name: trimmed.substring(9).trim() };
  }
  if (trimmed.startsWith('delivery:')) {
    return { type: 'delivery', name: trimmed.substring(9).trim() };
  }
  if (trimmed.startsWith('pickup:')) {
    return { type: 'pickup', name: trimmed.substring(7).trim() };
  }

  // Legacy/Fallback classification
  const lower = trimmed.toLowerCase();
  if (lower.includes('pickup') || lower.includes('pick-up') || lower === 'pickup') {
    return { type: 'pickup', name: 'Store Pickup' };
  }
  if (
    lower.includes('grab') ||
    lower.includes('lalamove') ||
    lower.includes('toktok') ||
    lower.includes('borzo') ||
    lower.includes('delivery')
  ) {
    // Attempt to match common delivery services
    let name = trimmed;
    if (lower === 'grab') name = 'Grab Express';
    if (lower === 'lalamove') name = 'Lalamove';
    if (lower === 'toktok') name = 'Toktok';
    return { type: 'delivery', name };
  }

  // Default fallback
  let name = trimmed;
  if (lower === 'jnt') name = 'J&T Express';
  if (lower === 'lbc') name = 'LBC Express';
  if (lower === 'jrs') name = 'JRS Express';
  return { type: 'shipping', name };
}

/**
 * Formats a display label for the courier name depending on fulfillment type.
 */
export function formatFulfillmentLabel(type: 'shipping' | 'delivery' | 'pickup', name: string): string {
  if (type === 'pickup') {
    return 'Store Pickup';
  }
  return name || 'Unspecified';
}

/**
 * Serializes the fulfillment type and name to store in the courier_name field.
 */
export function serializeCourierName(type: 'shipping' | 'delivery' | 'pickup', name: string): string {
  if (type === 'pickup') {
    return 'pickup:Store Pickup';
  }
  return `${type}:${name.trim()}`;
}
