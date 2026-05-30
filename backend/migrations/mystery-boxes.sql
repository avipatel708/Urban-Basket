-- Mystery Box feature: boxes + customer reward history
-- Run in Supabase SQL Editor after base schema.

CREATE TABLE IF NOT EXISTS public.mystery_boxes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL CHECK (price > 0),
  image_url TEXT,
  tier TEXT NOT NULL CHECK (tier IN ('budget', 'electronics', 'fashion', 'premium', 'gaming')),
  category_filter TEXT,
  min_items INTEGER NOT NULL DEFAULT 1 CHECK (min_items >= 1),
  max_items INTEGER NOT NULL DEFAULT 3 CHECK (max_items >= min_items),
  min_retail_multiplier DECIMAL(4, 2) NOT NULL DEFAULT 1.0,
  stock INTEGER NOT NULL DEFAULT 100 CHECK (stock >= 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.mystery_box_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mystery_box_id UUID NOT NULL REFERENCES public.mystery_boxes(id),
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  products JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_retail_value DECIMAL(10, 2) NOT NULL,
  box_price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mystery_box_rewards_user
  ON public.mystery_box_rewards(user_id, created_at DESC);

ALTER TABLE public.mystery_boxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mystery_box_rewards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active mystery boxes" ON public.mystery_boxes;
CREATE POLICY "Anyone can view active mystery boxes"
  ON public.mystery_boxes FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Users read own mystery rewards" ON public.mystery_box_rewards;
CREATE POLICY "Users read own mystery rewards"
  ON public.mystery_box_rewards FOR SELECT
  USING (auth.uid() = user_id);

-- Seed the five box types (idempotent on slug)
INSERT INTO public.mystery_boxes (slug, title, description, price, image_url, tier, category_filter, min_items, max_items, min_retail_multiplier, stock, sort_order)
VALUES
  (
    'budget-mystery-box',
    'Budget Mystery Box',
    'Surprise picks under ₹999 total value — perfect starter loot.',
    499,
    'https://images.unsplash.com/photo-1607083206869-4c6672c72b65?w=600&q=80',
    'budget',
    NULL,
    2,
    3,
    1.05,
    200,
    1
  ),
  (
    'electronics-mystery-box',
    'Electronics Mystery Box',
    'Gadgets and tech accessories worth more than you pay.',
    1999,
    'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=600&q=80',
    'electronics',
    'electronics',
    1,
    2,
    1.1,
    150,
    2
  ),
  (
    'fashion-mystery-box',
    'Fashion Mystery Box',
    'Curated style essentials — streetwear to premium basics.',
    1499,
    'https://images.unsplash.com/photo-1483985988354-763728e3685b?w=600&q=80',
    'fashion',
    'fashion',
    2,
    3,
    1.1,
    150,
    3
  ),
  (
    'premium-mystery-box',
    'Premium Mystery Box',
    'High-value flagship surprises across top categories.',
    4999,
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&q=80',
    'premium',
    NULL,
    2,
    4,
    1.15,
    80,
    4
  ),
  (
    'gaming-mystery-box',
    'Gaming Mystery Box',
    'Peripherals, games gear, and neon-ready accessories.',
    2499,
    'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&q=80',
    'gaming',
    'toys',
    2,
    3,
    1.1,
    120,
    5
  )
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  tier = EXCLUDED.tier,
  category_filter = EXCLUDED.category_filter,
  min_items = EXCLUDED.min_items,
  max_items = EXCLUDED.max_items,
  min_retail_multiplier = EXCLUDED.min_retail_multiplier,
  stock = EXCLUDED.stock,
  sort_order = EXCLUDED.sort_order;
