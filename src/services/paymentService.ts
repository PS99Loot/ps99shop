/**
 * Payment Service — uses crypto_settings from Supabase for wallet addresses.
 * Exchange rates are mock placeholders for USD → crypto conversion.
 * Replace MOCK_RATES with real API calls in production.
 */

const MOCK_RATES: Record<string, number> = {
  BTC: 67500,
  ETH: 3400,
  LTC: 85,
  USDT: 1,
};

export interface PaymentRequest {
  currency: string;
  network?: string;
  expectedAmount: string;
  walletAddress: string;
  expiresAt: string;
}

/** Create a payment request using the wallet address from crypto_settings */
export function createPaymentRequest(
  totalUsd: number,
  currency: string,
  walletAddress: string,
  network?: string | null,
): PaymentRequest {
  const rate = MOCK_RATES[currency] || 1;
  const amount = (totalUsd / rate).toFixed(8);
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

  return {
    currency,
    network: network || undefined,
    expectedAmount: amount,
    walletAddress,
    expiresAt,
  };
}

/** INTEGRATION POINT: Replace with blockchain websocket or polling */
export async function detectIncomingPayment(_address: string): Promise<{ detected: boolean; txHash?: string; amount?: string }> {
  return { detected: false };
}

/** INTEGRATION POINT: Replace with real amount comparison logic */
export function validatePaymentAmount(expected: string, received: string): 'exact' | 'underpaid' | 'overpaid' {
  const exp = parseFloat(expected);
  const rec = parseFloat(received);
  const tolerance = 0.001;
  if (Math.abs(exp - rec) < tolerance) return 'exact';
  return rec < exp ? 'underpaid' : 'overpaid';
}

/** INTEGRATION POINT: Replace with real blockchain confirmation polling */
export async function updateConfirmations(_txHash: string): Promise<number> {
  return 0;
}

/** INTEGRATION POINT: Replace with real finalization logic */
export async function confirmPayment(_orderId: string): Promise<boolean> {
  return false;
}

export function getExchangeRate(currency: string): number {
  return MOCK_RATES[currency] || 1;
}

export function formatCryptoAmount(amount: string, currency: string): string {
  const decimals = ['BTC', 'ETH'].includes(currency) ? 8 : ['LTC'].includes(currency) ? 6 : 2;
  return parseFloat(amount).toFixed(decimals);
}
