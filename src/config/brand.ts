/** Centralized brand configuration — change once, apply everywhere */
export const BRAND = {
  name: 'PS99Loot',
  tagline: 'The cheapest Pet Simulator 99 Huges',
  domain: 'ps99loot.com',
  siteUrl: 'https://ps99loot.com',
  supportEmail: 'support@ps99loot.com',
  priceStandard: 0.15,
  priceBulk: 0.10,
  bulkThreshold: 100,
  bulkDiscountPercent: 33,
  cryptos: ['BTC', 'ETH', 'LTC', 'USDT'],
} as const;

export function getUnitPrice(quantity: number): number {
  return quantity >= BRAND.bulkThreshold ? BRAND.priceBulk : BRAND.priceStandard;
}

export function getSubtotal(quantity: number): number {
  return quantity * getUnitPrice(quantity);
}

/** Generate an order-ID client-side (matches DB function format) */
export function generateOrderId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = 'PS99-';
  for (let i = 0; i < 6; i++) result += chars[Math.floor(Math.random() * chars.length)];
  return result;
}

/** Generate an access code client-side */
export function generateAccessCode(): string {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  let result = '';
  for (let i = 0; i < 12; i++) result += chars[Math.floor(Math.random() * chars.length)];
  return result;
}
