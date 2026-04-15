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
  titanicPrice: 15.0,
  cryptos: ['BTC', 'ETH', 'LTC', 'USDT'],
} as const;

export type ProductType = 'free_test_product' | 'random_huge_bundle' | 'random_titanic_bundle';

/** Get unit price for Random Huges based on quantity */
export function getHugeUnitPrice(quantity: number): number {
  return quantity >= BRAND.bulkThreshold ? BRAND.priceBulk : BRAND.priceStandard;
}

/** @deprecated Use getHugeUnitPrice */
export function getUnitPrice(quantity: number): number {
  return getHugeUnitPrice(quantity);
}

/** Get subtotal for Random Huges */
export function getHugeSubtotal(quantity: number): number {
  return quantity * getHugeUnitPrice(quantity);
}

/** @deprecated Use getHugeSubtotal */
export function getSubtotal(quantity: number): number {
  return getHugeSubtotal(quantity);
}

/** Get unit price by product type */
export function getProductUnitPrice(productType: ProductType, quantity: number): number {
  switch (productType) {
    case 'free_test_product': return 0;
    case 'random_huge_bundle': return getHugeUnitPrice(quantity);
    case 'random_titanic_bundle': return BRAND.titanicPrice;
    default: return 0;
  }
}

/** Pluralize product name */
export function pluralizeProduct(name: string, quantity: number): string {
  if (quantity === 1) {
    // Singular forms
    if (name === 'Random Huges') return 'Random Huge';
    if (name === 'Random Titanic Pets') return 'Random Titanic Pet';
    return name;
  }
  // Plural forms
  if (name === 'Random Huge') return 'Random Huges';
  if (name === 'Random Titanic Pet') return 'Random Titanic Pets';
  return name;
}

/** Format line item label: "2× Random Huges" */
export function formatLineItem(name: string, quantity: number): string {
  const displayName = quantity === 1
    ? (name === 'Random Huges' ? 'Random Huge' : name === 'Random Titanic Pets' ? 'Random Titanic Pet' : name)
    : (name === 'Random Huge' ? 'Random Huges' : name === 'Random Titanic Pet' ? 'Random Titanic Pets' : name);
  return `${quantity}× ${displayName}`;
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
