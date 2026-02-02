-- Ajouter la section Scène et réordonner (à exécuter si la section n'existe pas encore)
INSERT INTO public.sections (key, sort_order, visible, content) VALUES
  ('scene', 5, true, '{"title":"Scène","subtitle":"Julie Rosali en concert","body":"Julie se produit sur scène pour vos événements : concerts, festivals, soirées privées. Une artiste incarnée qui transporte son univers entre chanson française et couleurs latines. Contactez-la pour une prestation sur mesure.","imageUrl1":"","imageUrl2":"","ctaText":"Réserver une prestation"}')
ON CONFLICT (key) DO NOTHING;

UPDATE public.sections SET sort_order = 6 WHERE key = 'portrait';
UPDATE public.sections SET sort_order = 7 WHERE key = 'contact';
UPDATE public.sections SET sort_order = 8 WHERE key = 'social';
UPDATE public.sections SET sort_order = 9 WHERE key = 'streaming';
UPDATE public.sections SET sort_order = 10 WHERE key = 'footer';
