-- Section "Style" (couleur de fond du site + blocs)
-- À coller dans l'éditeur SQL Supabase si la section n'existe pas encore.

INSERT INTO public.sections (key, sort_order, visible, content) VALUES
  (
    'style',
    11,
    true,
    '{"backgroundGradient":"linear-gradient(135deg, #1a3a52 0%, #2d5a7b 25%, #e07c4a 70%, #c96538 100%)","backgroundAngle":135,"backgroundColors":["#1a3a52","#2d5a7b","#e07c4a","#c96538"],"accentColor":"#6b4e9e","accentOpacity":0.72,"blocks":{}}'
  )
ON CONFLICT (key) DO UPDATE SET
  visible = EXCLUDED.visible,
  content = EXCLUDED.content,
  updated_at = now();
