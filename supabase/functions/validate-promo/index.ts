import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json();
    const code = typeof body?.code === "string" ? body.code.trim() : "";
    const subtotal = Number(body?.subtotal);

    if (!code || code.length > 64) {
      return new Response(JSON.stringify({ valid: false, reason: "Invalid promo code" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!Number.isFinite(subtotal) || subtotal < 0) {
      return new Response(JSON.stringify({ valid: false, reason: "Invalid subtotal" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data, error } = await supabase.rpc("validate_promo_code", {
      p_code: code, p_subtotal: subtotal,
    });

    if (error) {
      console.error("validate_promo_code error:", error);
      return new Response(JSON.stringify({ valid: false, reason: "Validation failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const row = Array.isArray(data) ? data[0] : data;
    return new Response(JSON.stringify({
      valid: !!row?.valid,
      reason: row?.reason ?? null,
      promo_id: row?.promo_id ?? null,
      code: row?.code ?? null,
      discount_type: row?.discount_type ?? null,
      discount_value: row?.discount_value ?? null,
      discount_amount: Number(row?.discount_amount ?? 0),
      final_total: Number(row?.final_total ?? subtotal),
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("validate-promo error:", err);
    return new Response(JSON.stringify({ valid: false, reason: "Server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
