-- ============================================
-- Section "Scène" (sous les Clips)
-- À coller dans l'éditeur SQL de ton projet Supabase
-- ============================================
-- Si tu as déjà exécuté le schema.sql complet, la section Scène existe déjà.
-- Sinon, exécute ce qui suit pour l'ajouter et réordonner les sections.

-- 1) Ajouter la section Scène (ordre 5, juste après clips)
INSERT INTO public.sections (key, sort_order, visible, content) VALUES
  (
    'scene',
    5,
    true,
    '{"title":"Scène","subtitle":"Julie Rosali en concert","body":"Julie se produit sur scène pour vos événements : concerts, festivals, soirées privées. Une artiste incarnée qui transporte son univers entre chanson française et couleurs latines. Contactez-la pour une prestation sur mesure.","imageUrl1":"","imageUrl2":"","ctaText":"Réserver une prestation"}'
  )
ON CONFLICT (key) DO UPDATE SET
  sort_order = EXCLUDED.sort_order,
  visible = EXCLUDED.visible,
  content = EXCLUDED.content,
  updated_at = now();

-- 2) Réordonner les autres sections (pour garder l'ordre : album, présentation, player, clips, scene, portrait, contact)
UPDATE public.sections SET sort_order = 0 WHERE key = 'header';
UPDATE public.sections SET sort_order = 1 WHERE key = 'album';
UPDATE public.sections SET sort_order = 2 WHERE key = 'presentation';
UPDATE public.sections SET sort_order = 3 WHERE key = 'player';
UPDATE public.sections SET sort_order = 4 WHERE key = 'clips';
UPDATE public.sections SET sort_order = 5 WHERE key = 'scene';
UPDATE public.sections SET sort_order = 6 WHERE key = 'portrait';
UPDATE public.sections SET sort_order = 7 WHERE key = 'contact';
UPDATE public.sections SET sort_order = 8 WHERE key = 'social';
UPDATE public.sections SET sort_order = 9 WHERE key = 'streaming';
UPDATE public.sections SET sort_order = 10 WHERE key = 'footer';
