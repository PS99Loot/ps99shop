
-- Add OxaPay-specific columns to orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS oxapay_track_id text,
  ADD COLUMN IF NOT EXISTS oxapay_payment_url text,
  ADD COLUMN IF NOT EXISTS paid_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS payment_payload jsonb;

-- Index for webhook lookups
CREATE INDEX IF NOT EXISTS idx_orders_oxapay_track_id ON public.orders (oxapay_track_id) WHERE oxapay_track_id IS NOT NULL;
