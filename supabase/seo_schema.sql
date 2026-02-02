-- ============================================
-- SEO Command Center - Table et Storage
-- Exécuter dans l'éditeur SQL Supabase
-- ============================================

-- Table des réglages SEO par page (exhaustive)
CREATE TABLE IF NOT EXISTS public.page_seo_settings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  path text UNIQUE NOT NULL,
  -- Basic
  meta_title text,
  meta_description text,
  h1 text,
  -- Technical
  canonical_url text,
  robots_index boolean DEFAULT true,
  robots_follow boolean DEFAULT true,
  -- Open Graph
  og_title text,
  og_description text,
  og_image_url text,
  og_type text DEFAULT 'website',
  -- Twitter
  twitter_card text DEFAULT 'summary_large_image',
  twitter_title text,
  twitter_image_url text,
  -- Structured Data
  json_ld text,
  -- Global (path = '_global') : favicon uniquement
  favicon_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.page_seo_settings IS 'Métadonnées SEO par page : path = route (/, /album, /album/[slug]) ou _global pour favicon';
COMMENT ON COLUMN public.page_seo_settings.path IS 'Route Next.js : /, /album, /album/[slug], _global (favicon)';
COMMENT ON COLUMN public.page_seo_settings.robots_index IS 'true = index, false = noindex';
COMMENT ON COLUMN public.page_seo_settings.robots_follow IS 'true = follow, false = nofollow';
COMMENT ON COLUMN public.page_seo_settings.json_ld IS 'JSON-LD brut (string) pour schema.org';

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.set_seo_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS page_seo_settings_updated_at ON public.page_seo_settings;
CREATE TRIGGER page_seo_settings_updated_at
  BEFORE UPDATE ON public.page_seo_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_seo_updated_at();

-- RLS : lecture publique (pour le serveur Next.js / generateMetadata), écriture réservée aux admins
ALTER TABLE public.page_seo_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "page_seo_settings_select" ON public.page_seo_settings;
CREATE POLICY "page_seo_settings_select"
  ON public.page_seo_settings FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "page_seo_settings_insert_admin" ON public.page_seo_settings;
CREATE POLICY "page_seo_settings_insert_admin"
  ON public.page_seo_settings FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "page_seo_settings_update_admin" ON public.page_seo_settings;
CREATE POLICY "page_seo_settings_update_admin"
  ON public.page_seo_settings FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "page_seo_settings_delete_admin" ON public.page_seo_settings;
CREATE POLICY "page_seo_settings_delete_admin"
  ON public.page_seo_settings FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid())
  );

-- ============================================
-- Bucket Storage 'seo-assets' + politiques RLS
-- ============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'seo-assets',
  'seo-assets',
  true,
  524288,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/x-icon', 'image/vnd.microsoft.icon']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Politiques storage : lecture publique, écriture réservée aux admins (comme page_seo_settings)
DROP POLICY IF EXISTS "seo_assets_public_read" ON storage.objects;
CREATE POLICY "seo_assets_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'seo-assets');

DROP POLICY IF EXISTS "seo_assets_admin_insert" ON storage.objects;
CREATE POLICY "seo_assets_admin_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'seo-assets' AND
    EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "seo_assets_admin_update" ON storage.objects;
CREATE POLICY "seo_assets_admin_update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'seo-assets' AND
    EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "seo_assets_admin_delete" ON storage.objects;
CREATE POLICY "seo_assets_admin_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'seo-assets' AND
    EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid())
  );

-- Insertion des lignes par défaut (paths uniquement).
-- Pour remplir toutes les zones SEO avec du contenu inspiré du site, exécuter ensuite : supabase/seo_seed.sql
INSERT INTO public.page_seo_settings (path) VALUES
  ('_global'),
  ('/'),
  ('/album'),
  ('/album/[slug]')
ON CONFLICT (path) DO NOTHING;
