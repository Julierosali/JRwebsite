-- ============================================
-- Données SEO initiales (inspirées du contenu du site Julie Rosali)
-- Exécuter après seo_schema.sql (table page_seo_settings + bucket seo-assets)
-- Remplace les valeurs par défaut par du contenu prêt pour le référencement.
-- ============================================

-- _global : favicon uniquement (laisser null ou remplir après upload)
INSERT INTO public.page_seo_settings (
  path, meta_title, meta_description, h1, canonical_url,
  robots_index, robots_follow, og_title, og_description, og_image_url, og_type,
  twitter_card, twitter_title, twitter_image_url, json_ld, favicon_url
) VALUES (
  '_global',
  NULL, NULL, NULL, NULL,
  true, true, NULL, NULL, NULL, 'website',
  'summary_large_image', NULL, NULL, NULL, NULL
) ON CONFLICT (path) DO UPDATE SET
  updated_at = now();

-- Accueil /
INSERT INTO public.page_seo_settings (
  path, meta_title, meta_description, h1, canonical_url,
  robots_index, robots_follow, og_title, og_description, og_image_url, og_type,
  twitter_card, twitter_title, twitter_image_url, json_ld, favicon_url
) VALUES (
  '/',
  'Julie Rosali | Artiste - Auteure-compositrice-interprète',
  'Julie Rosali, artiste française indépendante. Chanson française, pop émotionnelle et influences latines. Découvrez les albums, le portrait et l''univers musical.',
  'Julie Rosali',
  NULL,
  true, true,
  'Julie Rosali — Auteure-compositrice-interprète',
  'Julie Rosali, artiste française indépendante. Chanson française, pop émotionnelle et influences latines.',
  NULL,
  'website',
  'summary_large_image',
  'Julie Rosali | Artiste',
  NULL,
  '{"@context":"https://schema.org","@type":"WebSite","name":"Julie Rosali","description":"Julie Rosali, artiste française indépendante. Chanson française, pop émotionnelle et influences latines.","url":"https://julierosali.fr","publisher":{"@type":"Person","name":"Julie Rosali"}}',
  NULL
) ON CONFLICT (path) DO UPDATE SET
  meta_title = EXCLUDED.meta_title,
  meta_description = EXCLUDED.meta_description,
  h1 = EXCLUDED.h1,
  og_title = EXCLUDED.og_title,
  og_description = EXCLUDED.og_description,
  og_type = EXCLUDED.og_type,
  twitter_card = EXCLUDED.twitter_card,
  twitter_title = EXCLUDED.twitter_title,
  json_ld = EXCLUDED.json_ld,
  updated_at = now();

-- Liste des albums /album
INSERT INTO public.page_seo_settings (
  path, meta_title, meta_description, h1, canonical_url,
  robots_index, robots_follow, og_title, og_description, og_image_url, og_type,
  twitter_card, twitter_title, twitter_image_url, json_ld, favicon_url
) VALUES (
  '/album',
  'Albums | Julie Rosali — Musique et discographie',
  'Découvrez les albums de Julie Rosali : chanson française, pop et influences latines. Écoutez les titres et plongez dans l''univers musical.',
  'Albums',
  NULL,
  true, true,
  'Albums — Julie Rosali',
  'Découvrez les albums de Julie Rosali : chanson française, pop et influences latines.',
  NULL,
  'website',
  'summary_large_image',
  'Albums | Julie Rosali',
  NULL,
  '{"@context":"https://schema.org","@type":"CollectionPage","name":"Albums — Julie Rosali","description":"Discographie de Julie Rosali. Chanson française, pop émotionnelle et influences latines.","url":"https://julierosali.fr/album","isPartOf":{"@type":"WebSite","name":"Julie Rosali"}}',
  NULL
) ON CONFLICT (path) DO UPDATE SET
  meta_title = EXCLUDED.meta_title,
  meta_description = EXCLUDED.meta_description,
  h1 = EXCLUDED.h1,
  og_title = EXCLUDED.og_title,
  og_description = EXCLUDED.og_description,
  og_type = EXCLUDED.og_type,
  twitter_card = EXCLUDED.twitter_card,
  twitter_title = EXCLUDED.twitter_title,
  json_ld = EXCLUDED.json_ld,
  updated_at = now();

-- Page détail album /album/[slug] (template : à personnaliser par album dans l’admin ou via titre dynamique)
INSERT INTO public.page_seo_settings (
  path, meta_title, meta_description, h1, canonical_url,
  robots_index, robots_follow, og_title, og_description, og_image_url, og_type,
  twitter_card, twitter_title, twitter_image_url, json_ld, favicon_url
) VALUES (
  '/album/[slug]',
  'Album | Julie Rosali — Écoute et discographie',
  'Écoutez l''album de Julie Rosali. Chanson française, pop émotionnelle et influences latines.',
  'Album',
  NULL,
  true, true,
  'Album — Julie Rosali',
  'Écoutez l''album de Julie Rosali. Chanson française, pop et influences latines.',
  NULL,
  'music.album',
  'summary_large_image',
  'Album | Julie Rosali',
  NULL,
  '{"@context":"https://schema.org","@type":"MusicAlbum","byArtist":{"@type":"Person","name":"Julie Rosali"},"description":"Album de Julie Rosali. Chanson française, pop émotionnelle et influences latines."}',
  NULL
) ON CONFLICT (path) DO UPDATE SET
  meta_title = EXCLUDED.meta_title,
  meta_description = EXCLUDED.meta_description,
  h1 = EXCLUDED.h1,
  og_title = EXCLUDED.og_title,
  og_description = EXCLUDED.og_description,
  og_type = EXCLUDED.og_type,
  twitter_card = EXCLUDED.twitter_card,
  twitter_title = EXCLUDED.twitter_title,
  json_ld = EXCLUDED.json_ld,
  updated_at = now();
