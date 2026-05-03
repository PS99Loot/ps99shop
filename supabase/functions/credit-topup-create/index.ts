import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization") || "";
    const token = auth.replace(/^Bearer\s+/i, "");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const oxapayKey = Deno.env.get("OXAPAY_MERCHANT_API_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: `Bearer ${token}` } } });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const user = userData.user;

    const { amount } = await req.json();
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt < 1 || amt > 10000) {
      return new Response(JSON.stringify({ error: "Amount must be between $1 and $10000" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: idData } = await admin.rpc("gen_topup_id");
    const topupId = idData as string;

    const { data: topup, error: insErr } = await admin.from("credit_topups").insert({
      public_topup_id: topupId,
      user_id: user.id,
      amount_usd: amt,
      status: "awaiting_payment",
    }).select().single();
    if (insErr || !topup) {
      return new Response(JSON.stringify({ error: "Failed to create top-up", details: insErr?.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const callbackUrl = `${supabaseUrl}/functions/v1/oxapay-webhook`;
    const oxaPayload = {
      merchant: oxapayKey,
      amount: amt,
      currency: "USD",
      lifeTime: 30,
      callbackUrl,
      orderId: topupId,
      description: `PS99Loot Store Credit Top-up ${topupId}`,
    };
    const oxaRes = await fetch("https://api.oxapay.com/merchants/request", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(oxaPayload),
    });
    const oxaData = await oxaRes.json();
    if (oxaData.result !== 100) {
      return new Response(JSON.stringify({ error: "Payment provider failed", details: oxaData.message }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    await admin.from("credit_topups").update({
      oxapay_track_id: String(oxaData.trackId),
      oxapay_payment_url: oxaData.payLink,
      payment_payload: oxaData,
    }).eq("id", topup.id);

    return new Response(JSON.stringify({ payment_url: oxaData.payLink, topup_id: topupId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("topup error", e);
    return new Response(JSON.stringify({ error: "Internal error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
