-- Coupons table
CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10,2) NOT NULL CHECK (discount_value > 0),
  minimum_order_amount DECIMAL(10,2) DEFAULT 0,
  maximum_discount DECIMAL(10,2),
  expiry_date TIMESTAMPTZ,
  usage_limit INTEGER DEFAULT 0,
  used_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  first_order_only BOOLEAN DEFAULT false,
  user_specific_expiry INTEGER DEFAULT 0,
  random_discount_enabled BOOLEAN DEFAULT false,
  random_discount_min DECIMAL(5,2) DEFAULT 0,
  random_discount_max DECIMAL(5,2) DEFAULT 0
);

-- User coupon usage tracking table
CREATE TABLE IF NOT EXISTS public.user_coupon_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  used_at TIMESTAMPTZ DEFAULT now(),
  discount_received DECIMAL(10,2) NOT NULL,
  UNIQUE(user_id, coupon_id)
);

CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons(coupon_code);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON public.coupons(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_coupon_usage_user ON public.user_coupon_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_user_coupon_usage_coupon ON public.user_coupon_usage(coupon_id);

-- Disable RLS for service role access (backend uses service role key)
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_coupon_usage ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
DROP POLICY IF EXISTS "Service role full access to coupons" ON public.coupons;
CREATE POLICY "Service role full access to coupons" ON public.coupons FOR ALL USING (true);

DROP POLICY IF EXISTS "Service role full access to coupon usage" ON public.user_coupon_usage;
CREATE POLICY "Service role full access to coupon usage" ON public.user_coupon_usage FOR ALL USING (true);
