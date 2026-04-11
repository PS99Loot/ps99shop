import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

async function hmacVerify(body: string, signature: string, secret: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
  const computed = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return computed === signature.toLowerCase();
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const rawBody = await req.text();
    const hmacHeader = req.headers.get("hmac") || "";
    const oxapayKey = Deno.env.get("OXAPAY_MERCHANT_API_KEY")!;

    // Verify HMAC
    const valid = await hmacVerify(rawBody, hmacHeader, oxapayKey);
    if (!valid) {
      console.error("HMAC verification failed");
      return new Response("Unauthorized", { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    console.log("OxaPay webhook payload:", JSON.stringify(payload));

    const trackId = String(payload.trackId);
    if (!trackId) {
      return new Response("Missing trackId", { status: 400 });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Find order by trackId
    const { data: orders, error: findError } = await supabase
      .from("orders")
      .select("id, public_order_id, status")
      .eq("oxapay_track_id", trackId)
      .limit(1);

    if (findError || !orders || orders.length === 0) {
      console.error("Order not found for trackId:", trackId, findError);
      return new Response("Order not found", { status: 404 });
    }

    const order = orders[0];
    const oxaStatus = (payload.status || "").toLowerCase();

    const updateData: Record<string, unknown> = {
      payment_payload: payload,
    };

    // Map OxaPay status to our status
    if (oxaStatus === "paid" || oxaStatus === "complete") {
      updateData.status = "paid";
      updateData.paid_at = new Date().toISOString();
      if (payload.currency) updateData.selected_crypto = payload.currency;
    } else if (oxaStatus === "confirming" || oxaStatus === "paying" || oxaStatus === "sending") {
      updateData.status = "payment_detected";
      if (payload.currency) updateData.selected_crypto = payload.currency;
    } else if (oxaStatus === "expired") {
      updateData.status = "expired";
    } else if (oxaStatus === "failed") {
      updateData.status = "cancelled";
    }

    const { error: updateError } = await supabase
      .from("orders")
      .update(updateData)
      .eq("id", order.id);

    if (updateError) {
      console.error("Failed to update order:", updateError);
    }

    // Log event
    await supabase.from("order_events").insert({
      order_id: order.id,
      event_type: `payment_${oxaStatus}`,
      event_message: `Payment status: ${oxaStatus}`,
      metadata: payload,
    });

    console.log(`Order ${order.public_order_id} updated to ${oxaStatus}`);
    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response("Internal error", { status: 500 });
  }
});
