// CPX Research configuration. App ID is a public placement identifier.
// Set via Vite env (VITE_CPX_APP_ID) or fall back to placeholder.
export const CPX_APP_ID: string = import.meta.env.VITE_CPX_APP_ID || '';

export function buildCpxIframeUrl(userId: string): string | null {
  if (!CPX_APP_ID || !userId) return null;
  const params = new URLSearchParams({
    app_id: CPX_APP_ID,
    ext_user_id: userId,
    subid_1: '',
    subid_2: '',
  });
  return `https://offers.cpx-research.com/index.php?${params.toString()}`;
}