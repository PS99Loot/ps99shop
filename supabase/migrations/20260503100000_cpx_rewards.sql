-- Allow 'cpx_reward' transaction type and create cpx_postbacks log
ALTER TABLE public.credit_transactions DROP CONSTRAINT IF EXISTS credit_transactions_type_check;
ALTER TABLE public.credit_transactions
  ADD CONSTRAINT credit_transactions_type_check
  CHECK (type IN ('topup','purchase','referral_reward','admin_adjustment','refund','cpx_reward'));

CREATE TABLE IF NOT EXISTS public.cpx_postbacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trans_id TEXT NOT NULL UNIQUE,
  ext_user_id UUID,
  amount_usd NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'credited',
  raw_payload JSONB,
  ip TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.cpx_postbacks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view cpx postbacks" ON public.cpx_postbacks FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.admin_adjust_credit(
  p_user_id UUID, p_amount NUMERIC, p_note TEXT
) RETURNS NUMERIC
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE new_bal NUMERIC;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  UPDATE public.profiles
    SET store_credit_usd = GREATEST(store_credit_usd + p_amount, 0)
    WHERE id = p_user_id
    RETURNING store_credit_usd INTO new_bal;
  INSERT INTO public.credit_transactions(user_id, amount, balance_after, type, reference, note)
    VALUES (p_user_id, p_amount, new_bal, 'admin_adjustment',
            'admin:' || gen_random_uuid()::text, p_note);
  RETURN new_bal;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_adjust_credit(UUID,NUMERIC,TEXT) TO authenticated;
