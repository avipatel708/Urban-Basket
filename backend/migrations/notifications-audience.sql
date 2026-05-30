-- Run in Supabase SQL Editor: separate customer vs seller notifications
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS audience TEXT NOT NULL DEFAULT 'customer'
  CHECK (audience IN ('customer', 'seller'));

CREATE INDEX IF NOT EXISTS idx_notifications_user_audience
  ON public.notifications(user_id, audience);
