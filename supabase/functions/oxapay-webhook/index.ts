import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

async function hmacVerify(body: string, signature: string, secret: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-512" }, false, ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
  const computed = Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
  return computed === signature.toLowerCase();
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  try {
    const rawBody = await req.text();
    const hmacHeader = req.headers.get("hmac") || "";
    const oxapayKey = Deno.env.get("OXAPAY_MERCHANT_API_KEY")!;
    const valid = await hmacVerify(rawBody, hmacHeader, oxapayKey);
    if (!valid) {
      console.error("HMAC verification failed");
      return new Response("Unauthorized", { status: 401 });
    }
    const payload = JSON.parse(rawBody);
    console.log("OxaPay webhook payload:", JSON.stringify(payload));
    const trackId = String(payload.trackId);
    if (!trackId) return new Response("Missing trackId", { status: 400 });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const oxaStatus = String(payload.status || "").toLowerCase();
    const isPaid = oxaStatus === "paid" || oxaStatus === "complete";

    // 1) Try as a CREDIT TOP-UP first
    const { data: topups } = await supabase.from("credit_topups")
      .select("id, public_topup_id, user_id, amount_usd, status")
      .eq("oxapay_track_id", trackId).limit(1);
    if (topups && topups.length > 0) {
      const t = topups[0] as any;
      const updates: Record<string, unknown> = { payment_payload: payload };
      if (isPaid) {
        updates.status = "paid";
        updates.paid_at = new Date().toISOString();
      } else if (oxaStatus === "expired") updates.status = "expired";
      else if (oxaStatus === "failed") updates.status = "cancelled";
      await supabase.from("credit_topups").update(updates).eq("id", t.id);

      if (isPaid && t.status !== "paid") {
        // Idempotent credit application
        await supabase.rpc("apply_credit", {
          p_user_id: t.user_id,
          p_amount: Number(t.amount_usd),
          p_type: "topup",
          p_order_id: null,
          p_reference: "topup:" + t.public_topup_id,
          p_note: `Crypto top-up ${t.public_topup_id}`,
        });
      }
      return new Response("OK", { status: 200 });
    }

    // 2) Otherwise treat as ORDER
    const { data: orders, error: findError } = await supabase.from("orders")
      .select("id, public_order_id, status, promo_code_id, user_id, total_usd, referrer_user_id")
      .eq("oxapay_track_id", trackId).limit(1);
    if (findError || !orders || orders.length === 0) {
      console.error("Order not found for trackId:", trackId, findError);
      return new Response("Order not found", { status: 404 });
    }
    const order = orders[0] as any;

    const updateData: Record<string, unknown> = { payment_payload: payload };
    if (isPaid) {
      updateData.status = "paid";
      updateData.paid_at = new Date().toISOString();
      if (payload.currency) updateData.selected_crypto = payload.currency;
    } else if (oxaStatus === "confirming" || oxaStatus === "paying" || oxaStatus === "sending") {
      updateData.status = "payment_detected";
      if (payload.currency) updateData.selected_crypto = payload.currency;
    } else if (oxaStatus === "expired") updateData.status = "expired";
    else if (oxaStatus === "failed") updateData.status = "cancelled";

    await supabase.from("orders").update(updateData).eq("id", order.id);

    if (isPaid && order.status !== "paid") {
      if (order.promo_code_id) {
        await supabase.rpc("increment_promo_usage", { p_promo_id: order.promo_code_id });
      }
      // Referral reward (5%) — idempotent via UNIQUE(referred_order_id)
      if (order.referrer_user_id && order.referrer_user_id !== order.user_id) {
        const reward = Math.round(Number(order.total_usd) * 5) / 100;
        if (reward > 0) {
          const { error: rrErr } = await supabase.from("referral_rewards").insert({
            referrer_user_id: order.referrer_user_id,
            referred_order_id: order.id,
            reward_amount: reward,
          });
          if (!rrErr) {
            await supabase.rpc("apply_credit", {
              p_user_id: order.referrer_user_id,
              p_amount: reward,
              p_type: "referral_reward",
              p_order_id: order.id,
              p_reference: "referral:" + order.id,
              p_note: `Referral reward for order ${order.public_order_id}`,
            });
          }
        }
      }
    }

    await supabase.from("order_events").insert({
      order_id: order.id,
      event_type: `payment_${oxaStatus}`,
      event_message: `Payment status: ${oxaStatus}`,
      metadata: payload,
    });
    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response("Internal error", { status: 500 });
  }
});
