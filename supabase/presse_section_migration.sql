-- ============================================
-- Migration : Ajout de la section "Presse"
-- + Bucket de stockage pour les documents (PDF)
-- À exécuter dans l'éditeur SQL du projet Supabase
-- ============================================

-- 1) Bucket pour les documents (PDF dossier de presse, etc.)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'site-documents',
  'site-documents',
  true,
  10485760,
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Politiques storage pour site-documents
DROP POLICY IF EXISTS "site_documents_public_read" ON storage.objects;
DROP POLICY IF EXISTS "site_documents_authenticated_upload" ON storage.objects;
DROP POLICY IF EXISTS "site_documents_authenticated_update" ON storage.objects;
DROP POLICY IF EXISTS "site_documents_authenticated_delete" ON storage.objects;

CREATE POLICY "site_documents_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'site-documents');

CREATE POLICY "site_documents_authenticated_upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'site-documents' AND auth.role() = 'authenticated');

CREATE POLICY "site_documents_authenticated_update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'site-documents' AND auth.role() = 'authenticated');

CREATE POLICY "site_documents_authenticated_delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'site-documents' AND auth.role() = 'authenticated');

-- 2) Déterminer le sort_order : placer "presse" juste après "scene"
-- On prend le sort_order de "scene" +1, puis on décale portrait et contact si nécessaire.

DO $$
DECLARE
  scene_order int;
BEGIN
  SELECT sort_order INTO scene_order FROM public.sections WHERE key = 'scene';
  IF scene_order IS NULL THEN
    scene_order := 5;
  END IF;

  -- Décaler les sections qui sont après "scene" (portrait, contact, etc.)
  UPDATE public.sections
    SET sort_order = sort_order + 1
    WHERE sort_order > scene_order;

  -- Insérer la section presse si elle n'existe pas déjà
  INSERT INTO public.sections (key, sort_order, visible, content)
  VALUES (
    'presse',
    scene_order + 1,
    true,
    '{
      "fr": {
        "title": "Presse",
        "subtitle": "Julie Rosali dans les médias",
        "body": "Articles de presse, couvertures, passages radio… Julie Rosali fait vibrer les ondes et les pages. Découvrez ses apparitions médiatiques et téléchargez le dossier de presse.",
        "ctaText": "Contacter",
        "pressKitText": "Télécharger le dossier de presse",
        "pressKitUrl": "",
        "imageUrl": "",
        "articles": [],
        "radios": []
      },
      "es": {
        "title": "Prensa",
        "subtitle": "Julie Rosali en los medios",
        "body": "Artículos de prensa, portadas, emisiones de radio… Julie Rosali hace vibrar las ondas y las páginas. Descubra sus apariciones mediáticas y descargue el dossier de prensa.",
        "ctaText": "Contactar",
        "pressKitText": "Descargar el dossier de prensa"
      },
      "articlesScrollSpeed": 40,
      "radiosScrollSpeed": 40
    }'::jsonb
  )
  ON CONFLICT (key) DO NOTHING;
END $$;
