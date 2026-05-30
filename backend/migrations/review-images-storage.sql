-- Review images: Supabase Storage bucket + optional multi-image column

ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS photo_url TEXT,
  ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS review_images JSONB DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_reviews_user ON public.reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_order ON public.reviews(order_id);

-- Storage bucket for customer review photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'review-images',
  'review-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Anyone can view review images" ON storage.objects;
CREATE POLICY "Anyone can view review images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'review-images');

DROP POLICY IF EXISTS "Authenticated users can upload review images" ON storage.objects;
CREATE POLICY "Authenticated users can upload review images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'review-images' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can update own review images" ON storage.objects;
CREATE POLICY "Users can update own review images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'review-images' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can delete own review images" ON storage.objects;
CREATE POLICY "Users can delete own review images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'review-images' AND auth.uid()::text = (storage.foldername(name))[1]);
