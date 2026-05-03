const KEY = 'ps99loot_ref';
const TTL_DAYS = 30;

export function setReferralCookie(code: string) {
  const c = code.trim().toUpperCase().slice(0, 32);
  if (!c) return;
  const expires = new Date(Date.now() + TTL_DAYS * 86400_000).toUTCString();
  document.cookie = `${KEY}=${encodeURIComponent(c)}; expires=${expires}; path=/; SameSite=Lax`;
  try { localStorage.setItem(KEY, c); } catch {}
}

export function getReferralCookie(): string | null {
  const m = document.cookie.match(new RegExp('(?:^|; )' + KEY + '=([^;]*)'));
  if (m?.[1]) return decodeURIComponent(m[1]);
  try { return localStorage.getItem(KEY); } catch { return null; }
}

export function clearReferralCookie() {
  document.cookie = `${KEY}=; Max-Age=0; path=/`;
  try { localStorage.removeItem(KEY); } catch {}
}
