// Vercel serverless function: CPX Research postback handler
// Configure CPX postback URL: https://<your-domain>/api/cpx-postback?trans_id={trans_id}&user_id={user_id}&amount_usd={amount_usd}&hash={secure_hash}&status={status}&type={type}
// Required env vars (set in Vercel project settings):
//   CPX_SECURE_HASH_KEY    - your CPX Research secure hash key
//   SUPABASE_URL           - your Supabase project URL
//   SUPABASE_SERVICE_ROLE_KEY - service role key (server-only)
//   USD_PER_CPX_DOLLAR     - optional, default 1 (CPX sends amount_usd in USD already)

import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

export const config = { runtime: 'nodejs' };

function getParam(req: any, key: string): string | undefined {
  const v = req.query?.[key] ?? (req.body && typeof req.body === 'object' ? req.body[key] : undefined);
  if (Array.isArray(v)) return v[0];
  return v == null ? undefined : String(v);
}

export default async function handler(req: any, res: any) {
  try {
    const transId = getParam(req, 'trans_id');
    const extUserId = getParam(req, 'user_id') || getParam(req, 'ext_user_id');
    const amountRaw = getParam(req, 'amount_usd') ?? getParam(req, 'amount_local') ?? getParam(req, 'amount');
    const hash = getParam(req, 'hash') || getParam(req, 'secure_hash');
    const status = getParam(req, 'status') ?? '1';
    const type = getParam(req, 'type') ?? '';

    if (!transId || !extUserId || amountRaw == null) {
      res.status(400).send('0');
      return;
    }

    const secret = process.env.CPX_SECURE_HASH_KEY;
    if (secret) {
      // CPX Research formula: md5(trans_id + "-" + secure_hash_key)
      const expected = crypto.createHash('md5').update(`${transId}-${secret}`).digest('hex');
      if (!hash || hash.toLowerCase() !== expected.toLowerCase()) {
        console.error('[cpx-postback] hash mismatch', { transId });
        res.status(401).send('0');
        return;
      }
    }

    const amount = Number(amountRaw);
    if (!Number.isFinite(amount)) { res.status(400).send('0'); return; }

    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    if (!supabaseUrl || !serviceKey) {
      console.error('[cpx-postback] missing supabase env');
      res.status(500).send('0');
      return;
    }
    const supabase = createClient(supabaseUrl, serviceKey);

    // Idempotency: insert postback row with UNIQUE trans_id
    const ip = (req.headers['x-forwarded-for'] || '').toString().split(',')[0].trim() || req.socket?.remoteAddress || null;
    const { error: insErr } = await supabase.from('cpx_postbacks').insert({
      trans_id: transId,
      ext_user_id: extUserId,
      amount_usd: amount,
      status: type === 'reversal' || status === '2' ? 'reversed' : 'credited',
      raw_payload: { query: req.query ?? null, body: req.body ?? null },
      ip,
    });
    if (insErr) {
      // Already processed -> respond 1 to ack
      if (String(insErr.code) === '23505') {
        res.status(200).send('1');
        return;
      }
      console.error('[cpx-postback] insert error', insErr);
      res.status(500).send('0');
      return;
    }

    // Reversal: subtract credit (negative amount); credit otherwise
    const isReversal = type === 'reversal' || status === '2';
    const delta = isReversal ? -Math.abs(amount) : Math.abs(amount);

    const { error: rpcErr } = await supabase.rpc('apply_credit', {
      p_user_id: extUserId,
      p_amount: delta,
      p_type: 'cpx_reward',
      p_order_id: null,
      p_reference: 'cpx:' + transId,
      p_note: isReversal ? 'CPX Research reversal' : 'CPX Research survey reward',
    });
    if (rpcErr) {
      console.error('[cpx-postback] apply_credit failed', rpcErr);
      res.status(500).send('0');
      return;
    }
    res.status(200).send('1');
  } catch (e) {
    console.error('[cpx-postback] error', e);
    res.status(500).send('0');
  }
}