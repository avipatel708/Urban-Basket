-- Product returns: 10-day window after delivery, refund to Urban-Basket wallet

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS returned_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS return_reason TEXT;

-- Extend allowed order statuses (drop/recreate CHECK if it exists)
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_status_check
  CHECK (status IN (
    'pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'
  ));

CREATE INDEX IF NOT EXISTS idx_orders_delivered_at ON public.orders(delivered_at);
