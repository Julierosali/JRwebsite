-- ============================================
-- Julie Rosali Website - Schéma Supabase
-- Exécuter dans l'éditeur SQL du projet Supabase
-- ============================================

-- Extensions utiles
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table des sections (ordre, visibilité, contenu JSON)
CREATE TABLE IF NOT EXISTS public.sections (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  key text UNIQUE NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  visible boolean NOT NULL DEFAULT true,
  content jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table des médias (images / références) pour galerie, pochette, etc.
CREATE TABLE IF NOT EXISTS public.media (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  section_key text NOT NULL,
  bucket text NOT NULL,
  path text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('image', 'video')),
  alt text,
  sort_order int NOT NULL DEFAULT 0,
  meta jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  UNIQUE(bucket, path)
);

-- Table des admins (seuls ces user_id peuvent modifier le site)
CREATE TABLE IF NOT EXISTS public.admin_users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Trigger updated_at sur sections
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sections_updated_at ON public.sections;
CREATE TRIGGER sections_updated_at
  BEFORE UPDATE ON public.sections
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Lecture publique : tout le monde peut lire sections et media
CREATE POLICY "sections_select_public"
  ON public.sections FOR SELECT
  USING (true);

CREATE POLICY "media_select_public"
  ON public.media FOR SELECT
  USING (true);

-- Admin : seul un user présent dans admin_users peut INSERT/UPDATE/DELETE
CREATE POLICY "sections_admin_all"
  ON public.sections FOR ALL
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));

CREATE POLICY "media_admin_all"
  ON public.media FOR ALL
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));

-- Admin_users : seul un admin peut lire la liste (pour vérifier si connecté)
CREATE POLICY "admin_users_select_self"
  ON public.admin_users FOR SELECT
  USING (auth.uid() = id);

-- Pas d'insert via l'app (faire manuellement en SQL pour le premier admin)
-- Si besoin d'ajouter un admin plus tard :
-- INSERT INTO public.admin_users (id) VALUES ('uuid-de-l-utilisateur-auth');

-- Stockage : bucket pour images du site
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'site-images',
  'site-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Politique storage : lecture publique
CREATE POLICY "site_images_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'site-images');

-- Politique storage : écriture réservée aux admins (via service role ou auth.uid() dans admin_users)
-- Supabase Storage RLS : on autorise l'upload si l'utilisateur est authentifié (à restreindre en prod aux admins si besoin)
CREATE POLICY "site_images_authenticated_upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'site-images' AND auth.role() = 'authenticated');

CREATE POLICY "site_images_authenticated_update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'site-images' AND auth.role() = 'authenticated');

CREATE POLICY "site_images_authenticated_delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'site-images' AND auth.role() = 'authenticated');

-- Données initiales des sections (contenu par défaut)
INSERT INTO public.sections (key, sort_order, visible, content) VALUES
  ('header', 0, true, '{"title":"Julie Rosali","subtitle":"Auteure-compositrice-interprète"}'),
  ('album', 1, true, '{"title":"Nouvel album","albumTitle":"LIBRE","subtitle":"11 titres, deux univers","coverUrl":"","pageSlug":"album","description":"Libre est un album de 11 titres, pensé autour de deux univers distincts, à la fois visuels, émotionnels et musicaux.","albumPage":{"releaseDate":"","artist":"Julie Rosali","label":"","producer":"","youtubeEmbedId":"","soundcloudEmbedUrl":"","buttons":[]}}'),
  ('presentation', 2, true, '{"title":"L''UNIVERS","body":"Julie Rosali est une artiste française indépendante, auteure-compositrice-interprète. Son travail s''inscrit à la croisée de la chanson française, de la pop émotionnelle et d''influences latines affirmées. Elle écrit des chansons intimes, incarnées, où la voix et le texte occupent une place centrale, tout en laissant une large place aux couleurs musicales et aux contrastes. Son univers ne se limite pas à la variété française : il navigue entre ballades dépouillées, chansons mélodiques modernes et rythmes plus chauds inspirés des cultures latines, parfois en espagnol.","imageUrl":""}'),
  ('player', 3, true, '{"title":"Écouter","spotifyEmbedUrl":"","spotifyPlaylistId":""}'),
  ('clips', 4, true, '{"title":"Clips","videos":[{"title":"Clip 1","youtubeId":""},{"title":"Clip 2","youtubeId":""},{"title":"Clip 3","youtubeId":""}]}'),
  ('scene', 5, true, '{"title":"Scène","subtitle":"Julie Rosali en concert","body":"Julie se produit sur scène pour vos événements : concerts, festivals, soirées privées. Une artiste incarnée qui transporte son univers entre chanson française et couleurs latines. Contactez-la pour une prestation sur mesure.","imageUrl1":"","imageUrl2":"","ctaText":"Réserver une prestation"}'),
  ('portrait', 6, true, '{"title":"Portrait","images":[]}'),
  ('contact', 7, true, '{"title":"Contact","body":"","imageUrl":"","email":"julie.rosali@outlook.com","phone":"06 46 63 98 76"}'),
  ('social', 8, true, '{"links":[{"platform":"instagram","url":""},{"platform":"tiktok","url":""},{"platform":"facebook","url":""},{"platform":"x","url":""}]}'),
  ('streaming', 9, true, '{"links":[{"platform":"spotify","url":""},{"platform":"deezer","url":""},{"platform":"youtube","url":""},{"platform":"soundcloud","url":""},{"platform":"amazon","url":""}]}'),
  ('footer', 10, true, '{"text":"Copyright ©2026 Julie Rosali | Tous droits réservés."}')
ON CONFLICT (key) DO UPDATE SET sort_order = EXCLUDED.sort_order;
