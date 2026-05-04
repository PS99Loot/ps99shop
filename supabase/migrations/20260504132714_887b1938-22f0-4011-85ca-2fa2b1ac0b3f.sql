-- Allow anyone to read promo codes for validation at checkout (guest checkout supported)
CREATE POLICY "Anyone can view promo codes for validation"
ON public.promo_codes
FOR SELECT
USING (true);