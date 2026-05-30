-- Realtime order tracking: extended statuses, timestamps, history, Supabase Realtime
-- Run in Supabase SQL Editor after base schema.

-- Drop old status constraint and apply expanded lifecycle
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS tracking_step INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS estimated_delivery TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;

-- delivered_at may already exist from order-returns.sql
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_status_check CHECK (
    status IN (
      'pending',
      'confirmed',
      'packed',
      'processing',
      'shipped',
      'out_for_delivery',
      'delivered',
      'cancelled',
      'returned'
    )
  );

-- Order status history for full audit trail
CREATE TABLE IF NOT EXISTS public.order_tracking_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  updated_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_tracking_history_order_id
  ON public.order_tracking_history(order_id, created_at DESC);

ALTER TABLE public.order_tracking_history ENABLE ROW LEVEL SECURITY;

-- Customers: read history for own orders
DROP POLICY IF EXISTS "Customers read own tracking history" ON public.order_tracking_history;
CREATE POLICY "Customers read own tracking history"
  ON public.order_tracking_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_tracking_history.order_id
        AND o.user_id = auth.uid()
    )
  );

-- Sellers: read history for orders containing their products
DROP POLICY IF EXISTS "Sellers read tracking history" ON public.order_tracking_history;
CREATE POLICY "Sellers read tracking history"
  ON public.order_tracking_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.order_items oi
      JOIN public.products p ON p.id = oi.product_id
      WHERE oi.order_id = order_tracking_history.order_id
        AND p.seller_id = auth.uid()
    )
  );

-- Enable Supabase Realtime (safe if already added)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.order_tracking_history;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
