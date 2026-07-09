export interface SaleAwareItem {
  price: string | number;
  sale_price?: string | number | null;
  sale_starts_at?: string | null;
  sale_ends_at?: string | null;
}

/**
 * A sale is active whenever sale_price is set AND (if given) the current
 * time falls within the optional start/end window — blank dates on either
 * side mean "no limit" on that side, matching "time limited or unlimited."
 * Shared by both Catalog items and Services so the rule never drifts apart.
 */
export function getActiveSale(item: SaleAwareItem): { original: number; sale: number; percentOff: number } | null {
  const salePrice = item.sale_price != null ? Number(item.sale_price) : null;
  if (salePrice == null || Number.isNaN(salePrice)) return null;

  const original = Number(item.price);
  if (Number.isNaN(original) || salePrice >= original) return null;

  const now = Date.now();
  if (item.sale_starts_at && now < new Date(item.sale_starts_at).getTime()) return null;
  if (item.sale_ends_at && now > new Date(item.sale_ends_at).getTime()) return null;

  const percentOff = Math.round(((original - salePrice) / original) * 100);
  return { original, sale: salePrice, percentOff };
}
