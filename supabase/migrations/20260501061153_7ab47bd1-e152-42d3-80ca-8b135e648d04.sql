CREATE TABLE public.promo_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage','fixed')),
  discount_value NUMERIC NOT NULL CHECK (discount_value >= 0),
  active BOOLEAN NOT NULL DEFAULT true,
  usage_limit INTEGER,
  usage_count INTEGER NOT NULL DEFAULT 0,
  expiration_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_promo_codes_code ON public.promo_codes (LOWER(code));

ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view promo codes" ON public.promo_codes
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert promo codes" ON public.promo_codes
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update promo codes" ON public.promo_codes
  FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete promo codes" ON public.promo_codes
  FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_promo_codes_updated_at
  BEFORE UPDATE ON public.promo_codes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.orders
  ADD COLUMN promo_code TEXT,
  ADD COLUMN promo_code_id UUID REFERENCES public.promo_codes(id),
  ADD COLUMN discount_amount NUMERIC NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.validate_promo_code(p_code TEXT, p_subtotal NUMERIC)
RETURNS TABLE (
  valid BOOLEAN,
  reason TEXT,
  promo_id UUID,
  code TEXT,
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
  d NUMERIC := 0;
  final_t NUMERIC := p_subtotal;
BEGIN
  SELECT * INTO pc FROM public.promo_codes WHERE LOWER(code) = LOWER(p_code) LIMIT 1;
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Promo code not found', NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::NUMERIC, 0::NUMERIC, p_subtotal;
    RETURN;
  END IF;
  IF NOT pc.active THEN
    RETURN QUERY SELECT false, 'Promo code is inactive', pc.id, pc.code, pc.discount_type, pc.discount_value, 0::NUMERIC, p_subtotal;
    RETURN;
  END IF;
  IF pc.expiration_date IS NOT NULL AND pc.expiration_date < now() THEN
    RETURN QUERY SELECT false, 'Promo code has expired', pc.id, pc.code, pc.discount_type, pc.discount_value, 0::NUMERIC, p_subtotal;
    RETURN;
  END IF;
  IF pc.usage_limit IS NOT NULL AND pc.usage_count >= pc.usage_limit THEN
    RETURN QUERY SELECT false, 'Promo code usage limit reached', pc.id, pc.code, pc.discount_type, pc.discount_value, 0::NUMERIC, p_subtotal;
    RETURN;
  END IF;

  IF pc.discount_type = 'percentage' THEN
    d := ROUND((p_subtotal * pc.discount_value / 100)::NUMERIC, 2);
  ELSE
    d := pc.discount_value;
  END IF;
  IF d > p_subtotal THEN d := p_subtotal; END IF;
  final_t := GREATEST(p_subtotal - d, 0);

  RETURN QUERY SELECT true, NULL::TEXT, pc.id, pc.code, pc.discount_type, pc.discount_value, d, final_t;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_promo_usage(p_promo_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.promo_codes SET usage_count = usage_count + 1 WHERE id = p_promo_id;
END;
$$;

-- Hide Free Test Product (referenced by historical orders, can't delete)
UPDATE public.products SET active = false WHERE product_type = 'free_test_product' OR slug = 'free-test-product';

-- Add 1B Gems
INSERT INTO public.products (name, slug, price_usd, product_type, active, stock_quantity, description)
SELECT '1B Gems', '1b-gems', 5.00, 'gems_bundle', true, 9999, '1 Billion Gems for Pet Simulator 99 — delivered in-game.'
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE slug = '1b-gems' OR product_type = 'gems_bundle');