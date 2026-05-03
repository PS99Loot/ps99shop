-- =====================================================================
-- 1) FIX validate_promo_code (must DROP first to rename return columns)
-- =====================================================================
DROP FUNCTION IF EXISTS public.validate_promo_code(TEXT, NUMERIC);

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

GRANT EXECUTE ON FUNCTION public.validate_promo_code(TEXT, NUMERIC) TO anon, authenticated;

-- =====================================================================
-- 2) STORE CREDIT (profiles.store_credit_usd) + transactions
-- =====================================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS store_credit_usd NUMERIC(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;

CREATE OR REPLACE FUNCTION public.gen_referral_code()
RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE c TEXT;
BEGIN
  LOOP
    c := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE referral_code = c);
  END LOOP;
  RETURN c;
END;
$$;

UPDATE public.profiles SET referral_code = public.gen_referral_code() WHERE referral_code IS NULL;

CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  balance_after NUMERIC(10,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('topup','purchase','referral_reward','admin_adjustment','refund')),
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  reference TEXT,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (type, reference)
);
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own credit tx" ON public.credit_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins view all credit tx" ON public.credit_transactions FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- =====================================================================
-- 3) REFERRALS
-- =====================================================================
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS referral_code TEXT,
  ADD COLUMN IF NOT EXISTS referrer_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS payment_method TEXT NOT NULL DEFAULT 'crypto',
  ADD COLUMN IF NOT EXISTS store_credit_applied NUMERIC(10,2) NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.referral_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  reward_amount NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (referred_order_id)
);
ALTER TABLE public.referral_rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own referral rewards" ON public.referral_rewards FOR SELECT USING (auth.uid() = referrer_user_id);
CREATE POLICY "Admins view all referral rewards" ON public.referral_rewards FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- =====================================================================
-- 4) Server-side credit helpers (used by webhook / edge fns later)
-- =====================================================================
CREATE OR REPLACE FUNCTION public.apply_credit(
  p_user_id UUID,
  p_amount NUMERIC,
  p_type TEXT,
  p_order_id UUID,
  p_reference TEXT,
  p_note TEXT
) RETURNS NUMERIC
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE new_bal NUMERIC;
BEGIN
  IF EXISTS (SELECT 1 FROM public.credit_transactions WHERE type = p_type AND reference = p_reference AND p_reference IS NOT NULL) THEN
    SELECT store_credit_usd INTO new_bal FROM public.profiles WHERE id = p_user_id;
    RETURN new_bal;
  END IF;
  UPDATE public.profiles
    SET store_credit_usd = GREATEST(store_credit_usd + p_amount, 0)
    WHERE id = p_user_id
    RETURNING store_credit_usd INTO new_bal;
  INSERT INTO public.credit_transactions(user_id, amount, balance_after, type, order_id, reference, note)
    VALUES (p_user_id, p_amount, new_bal, p_type, p_order_id, p_reference, p_note);
  RETURN new_bal;
END;
$$;
REVOKE ALL ON FUNCTION public.apply_credit(UUID,NUMERIC,TEXT,UUID,TEXT,TEXT) FROM anon, authenticated;

-- Pay an order entirely with store credit (atomic, server-side)
CREATE OR REPLACE FUNCTION public.pay_order_with_credit(
  p_order_id TEXT,
  p_access_code TEXT
) RETURNS TABLE(success BOOLEAN, message TEXT, balance_after NUMERIC)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  ord public.orders%ROWTYPE;
  uid UUID := auth.uid();
  bal NUMERIC;
  new_bal NUMERIC;
BEGIN
  IF uid IS NULL THEN
    RETURN QUERY SELECT false, 'Login required to use store credit'::TEXT, 0::NUMERIC; RETURN;
  END IF;
  SELECT * INTO ord FROM public.orders
    WHERE public_order_id = p_order_id AND access_code = p_access_code;
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Order not found'::TEXT, 0::NUMERIC; RETURN;
  END IF;
  IF ord.user_id IS DISTINCT FROM uid THEN
    RETURN QUERY SELECT false, 'Order does not belong to user'::TEXT, 0::NUMERIC; RETURN;
  END IF;
  IF ord.status <> 'awaiting_payment' THEN
    RETURN QUERY SELECT false, 'Order is not awaiting payment'::TEXT, 0::NUMERIC; RETURN;
  END IF;
  SELECT store_credit_usd INTO bal FROM public.profiles WHERE id = uid FOR UPDATE;
  IF bal < ord.total_usd THEN
    RETURN QUERY SELECT false, 'Insufficient store credit'::TEXT, bal; RETURN;
  END IF;
  UPDATE public.profiles SET store_credit_usd = store_credit_usd - ord.total_usd
    WHERE id = uid RETURNING store_credit_usd INTO new_bal;
  INSERT INTO public.credit_transactions(user_id, amount, balance_after, type, order_id, reference, note)
    VALUES (uid, -ord.total_usd, new_bal, 'purchase', ord.id, 'order:' || ord.public_order_id, 'Paid order with store credit');
  UPDATE public.orders
    SET status = 'paid',
        payment_method = 'store_credit',
        store_credit_applied = ord.total_usd,
        updated_at = now()
    WHERE id = ord.id;
  INSERT INTO public.order_events(order_id, event_type, event_message)
    VALUES (ord.id, 'payment_received', 'Paid with store credit');
  RETURN QUERY SELECT true, 'Order paid'::TEXT, new_bal;
END;
$$;
GRANT EXECUTE ON FUNCTION public.pay_order_with_credit(TEXT,TEXT) TO authenticated;

-- Auto-assign referral_code when a profile is created
CREATE OR REPLACE FUNCTION public.tg_profile_set_referral_code()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := public.gen_referral_code();
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS profiles_set_referral_code ON public.profiles;
CREATE TRIGGER profiles_set_referral_code
  BEFORE INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.tg_profile_set_referral_code();
