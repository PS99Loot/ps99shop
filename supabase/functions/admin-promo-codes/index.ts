import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-token",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

async function expectedAdminToken(expiry: number) {
  const adminPassword = Deno.env.get("ADMIN_PANEL_PASSWORD")!;
  const data = new TextEncoder().encode(adminPassword + expiry.toString());
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json();
    const { action, token, expiry, payload } = body || {};

    if (!token || !expiry) return json({ error: "Auth required" }, 401);
    if (Date.now() >= Number(expiry)) return json({ error: "Session expired" }, 401);

    const expected = await expectedAdminToken(Number(expiry));
    if (expected !== token) return json({ error: "Invalid admin token" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    switch (action) {
      case "list": {
        const { data, error } = await supabase
          .from("promo_codes").select("*").order("created_at", { ascending: false });
        if (error) return json({ error: error.message }, 500);
        return json({ data });
      }
      case "create": {
        const code = String(payload?.code || "").trim().toUpperCase();
        const discount_type = String(payload?.discount_type || "");
        const discount_value = Number(payload?.discount_value);
        if (!code || code.length > 64) return json({ error: "Invalid code" }, 400);
        if (!["percentage", "fixed"].includes(discount_type)) return json({ error: "Invalid discount type" }, 400);
        if (!Number.isFinite(discount_value) || discount_value < 0) return json({ error: "Invalid discount value" }, 400);
        if (discount_type === "percentage" && discount_value > 100) return json({ error: "Percentage cannot exceed 100" }, 400);

        const insertRow: Record<string, unknown> = {
          code, discount_type, discount_value,
          active: payload?.active !== false,
        };
        if (payload?.usage_limit != null && payload.usage_limit !== "") {
          const ul = Number(payload.usage_limit);
          if (!Number.isFinite(ul) || ul < 1) return json({ error: "Invalid usage limit" }, 400);
          insertRow.usage_limit = ul;
        }
        if (payload?.expiration_date) insertRow.expiration_date = payload.expiration_date;

        const { data, error } = await supabase.from("promo_codes").insert(insertRow).select().single();
        if (error) return json({ error: error.message }, 400);
        return json({ data });
      }
      case "update": {
        const id = String(payload?.id || "");
        if (!id) return json({ error: "id required" }, 400);
        const updates: Record<string, unknown> = {};
        if (payload.code != null) updates.code = String(payload.code).trim().toUpperCase();
        if (payload.discount_type != null) {
          if (!["percentage", "fixed"].includes(payload.discount_type)) return json({ error: "Invalid discount type" }, 400);
          updates.discount_type = payload.discount_type;
        }
        if (payload.discount_value != null) {
          const v = Number(payload.discount_value);
          if (!Number.isFinite(v) || v < 0) return json({ error: "Invalid discount value" }, 400);
          updates.discount_value = v;
        }
        if (payload.active != null) updates.active = !!payload.active;
        if (payload.usage_limit !== undefined) {
          if (payload.usage_limit === null || payload.usage_limit === "") updates.usage_limit = null;
          else {
            const ul = Number(payload.usage_limit);
            if (!Number.isFinite(ul) || ul < 1) return json({ error: "Invalid usage limit" }, 400);
            updates.usage_limit = ul;
          }
        }
        if (payload.expiration_date !== undefined) {
          updates.expiration_date = payload.expiration_date || null;
        }
        const { data, error } = await supabase.from("promo_codes").update(updates).eq("id", id).select().single();
        if (error) return json({ error: error.message }, 400);
        return json({ data });
      }
      case "delete": {
        const id = String(payload?.id || "");
        if (!id) return json({ error: "id required" }, 400);
        const { error } = await supabase.from("promo_codes").delete().eq("id", id);
        if (error) return json({ error: error.message }, 400);
        return json({ ok: true });
      }
      default:
        return json({ error: "Unknown action" }, 400);
    }
  } catch (err) {
    console.error("admin-promo-codes error:", err);
    return json({ error: "Server error" }, 500);
  }
});
