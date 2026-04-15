
-- Add product_type to products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS product_type text;

-- Add product_type_snapshot to order_items
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS product_type_snapshot text;
