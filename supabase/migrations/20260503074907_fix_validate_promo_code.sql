CREATE OR REPLACE FUNCTION public.validate_promo_code(p_code TEXT, p_subtotal NUMERIC)
RETURNS TABLE (
  valid BOOLEAN,
  reason TEXT,
  promo_id UUID,
  promo_code TEXT,
  discount_type TEXT,
  discount_value NUMERIC,
  discount_amount NUMERIC,
  final_total NUMERIC
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pc public.promo_codes%ROWTYPE;
  v_code TEXT := LOWER(TRIM(COALESCE(p_code, '')));
  d NUMERIC := 0;
  final_t NUMERIC := COALESCE(p_subtotal, 0);
BEGIN
  IF v_code = '' THEN
    RETURN QUERY SELECT false, 'Invalid promo code'::TEXT, NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::NUMERIC, 0::NUMERIC, COALESCE(p_subtotal, 0);
    RETURN;
  END IF;

  SELECT pc_row.* INTO pc
  FROM public.promo_codes AS pc_row
  WHERE LOWER(pc_row.code) = v_code
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Invalid promo code'::TEXT, NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::NUMERIC, 0::NUMERIC, COALESCE(p_subtotal, 0);
    RETURN;
  END IF;
  IF NOT pc.active THEN
    RETURN QUERY SELECT false, 'Promo code is inactive'::TEXT, pc.id, pc.code, pc.discount_type, pc.discount_value, 0::NUMERIC, COALESCE(p_subtotal, 0);
    RETURN;
  END IF;
  IF pc.expiration_date IS NOT NULL AND pc.expiration_date < now() THEN
    RETURN QUERY SELECT false, 'Promo code has expired'::TEXT, pc.id, pc.code, pc.discount_type, pc.discount_value, 0::NUMERIC, COALESCE(p_subtotal, 0);
    RETURN;
  END IF;
  IF pc.usage_limit IS NOT NULL AND pc.usage_count >= pc.usage_limit THEN
    RETURN QUERY SELECT false, 'Promo code usage limit reached'::TEXT, pc.id, pc.code, pc.discount_type, pc.discount_value, 0::NUMERIC, COALESCE(p_subtotal, 0);
    RETURN;
  END IF;

  IF pc.discount_type = 'percentage' THEN
    d := ROUND((COALESCE(p_subtotal, 0) * pc.discount_value / 100)::NUMERIC, 2);
  ELSE
    d := pc.discount_value;
  END IF;
  IF d > COALESCE(p_subtotal, 0) THEN d := COALESCE(p_subtotal, 0); END IF;
  final_t := GREATEST(COALESCE(p_subtotal, 0) - d, 0);

  RETURN QUERY SELECT true, NULL::TEXT, pc.id, pc.code, pc.discount_type, pc.discount_value, d, final_t;
END;
$$;
