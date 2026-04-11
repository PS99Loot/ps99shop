import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { orderId, accessCode } = await req.json();
    if (!orderId || !accessCode) {
      return new Response(JSON.stringify({ error: "orderId and accessCode required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const oxapayKey = Deno.env.get("OXAPAY_MERCHANT_API_KEY")!;

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Look up order
    const { data: orders, error: lookupError } = await supabase
      .rpc("lookup_order", { p_order_id: orderId, p_access_code: accessCode });

    if (lookupError || !orders || orders.length === 0) {
      console.error("Order lookup failed:", lookupError);
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const order = orders[0];

    // Don't create invoice if already has one
    if (order.oxapay_payment_url) {
      return new Response(JSON.stringify({ payment_url: order.oxapay_payment_url }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create OxaPay invoice
    const callbackUrl = `${supabaseUrl}/functions/v1/oxapay-webhook`;

    const oxaPayload = {
      merchant: oxapayKey,
      amount: Number(order.total_usd),
      currency: "USD",
      lifeTime: 30, // minutes
      callbackUrl,
      orderId: order.public_order_id,
      description: `PS99Loot Order ${order.public_order_id} - ${Math.round(Number(order.total_usd) / 0.15)} Random Huges`,
    };

    console.log("Creating OxaPay invoice for order:", orderId);

    const oxaRes = await fetch("https://api.oxapay.com/merchants/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(oxaPayload),
    });

    const oxaData = await oxaRes.json();
    console.log("OxaPay response:", JSON.stringify(oxaData));

    if (oxaData.result !== 100) {
      return new Response(JSON.stringify({ error: "Failed to create payment", details: oxaData.message }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update order with OxaPay data
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        oxapay_track_id: String(oxaData.trackId),
        oxapay_payment_url: oxaData.payLink,
        status: "awaiting_payment",
        payment_payload: oxaData,
      })
      .eq("id", order.id);

    if (updateError) {
      console.error("Failed to update order:", updateError);
    }

    // Insert order event
    await supabase.from("order_events").insert({
      order_id: order.id,
      event_type: "payment_created",
      event_message: "Payment invoice created via OxaPay",
      metadata: { trackId: oxaData.trackId },
    });

    return new Response(JSON.stringify({ payment_url: oxaData.payLink }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error creating invoice:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
