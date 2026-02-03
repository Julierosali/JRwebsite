-- ============================================
-- Bilinguisme Fr / Es : migration du contenu des sections
-- Exécuter dans l'éditeur SQL Supabase après le schéma et les seeds existants.
-- Convertit content en { fr: <actuel>, es: <traduction espagnole> }.
-- Si vos sections ont déjà du contenu personnalisé, le script préserve "fr" et ajoute "es".
-- ============================================

-- Helper : ne migre que si pas déjà bilingue (pas de clé 'fr' ou 'es' au premier niveau)
-- On utilise content->'fr' pour détecter un content déjà bilingue.

-- Header
UPDATE public.sections SET content = jsonb_build_object(
  'fr', COALESCE(content->'fr', content),
  'es', jsonb_build_object(
    'title', 'Julie Rosali',
    'subtitle', 'Autora, compositora e intérprete'
  )
) WHERE key = 'header' AND content ? 'fr' = false AND content ? 'es' = false;

-- Album
UPDATE public.sections SET content = jsonb_build_object(
  'fr', COALESCE(content->'fr', content),
  'es', (COALESCE(content->'fr', content) - 'title' - 'subtitle' - 'albumTitle' - 'description') ||
    jsonb_build_object(
      'title', 'Nuevo álbum',
      'subtitle', '11 canciones, dos universos',
      'albumTitle', 'LIBRE',
      'description', 'Libre es un álbum de 11 canciones, pensado en torno a dos universos distintos, tanto visuales como emocionales y musicales.'
    )
) WHERE key = 'album' AND content ? 'fr' = false AND content ? 'es' = false;

-- Presentation
UPDATE public.sections SET content = jsonb_build_object(
  'fr', COALESCE(content->'fr', content),
  'es', (COALESCE(content->'fr', content) - 'title' - 'body') ||
    jsonb_build_object(
      'title', 'EL UNIVERSO',
      'body', 'Julie Rosali es una artista francesa independiente, autora, compositora e intérprete. Su trabajo se sitúa en la encrucijada de la canción francesa, el pop emocional y unas influencias latinas marcadas. Escribe canciones íntimas y encarnadas, donde la voz y el texto ocupan un lugar central, dejando al mismo tiempo un amplio espacio a los colores musicales y los contrastes. Su universo no se limita a la variedad francesa: navega entre baladas desnudas, canciones melódicas modernas y ritmos más cálidos inspirados en las culturas latinas, a veces en español.'
    )
) WHERE key = 'presentation' AND content ? 'fr' = false AND content ? 'es' = false;

-- Player
UPDATE public.sections SET content = jsonb_build_object(
  'fr', COALESCE(content->'fr', content),
  'es', (COALESCE(content->'fr', content) - 'title') ||
    jsonb_build_object('title', 'Escuchar')
) WHERE key = 'player' AND content ? 'fr' = false AND content ? 'es' = false;

-- Clips (videos: copie de la structure fr, titre section en espagnol)
UPDATE public.sections SET content = jsonb_build_object(
  'fr', COALESCE(content->'fr', content),
  'es', (COALESCE(content->'fr', content) - 'title') ||
    jsonb_build_object('title', 'Vídeos')
) WHERE key = 'clips' AND content ? 'fr' = false AND content ? 'es' = false;

-- Scene
UPDATE public.sections SET content = jsonb_build_object(
  'fr', COALESCE(content->'fr', content),
  'es', (COALESCE(content->'fr', content) - 'title' - 'subtitle' - 'body' - 'ctaText') ||
    jsonb_build_object(
      'title', 'Escenario',
      'subtitle', 'Julie Rosali en concierto',
      'body', 'Julie actúa en directo para sus eventos: conciertos, festivales, veladas privadas. Una artista con presencia que transporta su universo entre la canción francesa y los colores latinos. Contáctela para una actuación a medida.',
      'ctaText', 'Reservar una actuación'
    )
) WHERE key = 'scene' AND content ? 'fr' = false AND content ? 'es' = false;

-- Portrait
UPDATE public.sections SET content = jsonb_build_object(
  'fr', COALESCE(content->'fr', content),
  'es', (COALESCE(content->'fr', content) - 'title') ||
    jsonb_build_object('title', 'Retrato')
) WHERE key = 'portrait' AND content ? 'fr' = false AND content ? 'es' = false;

-- Contact
UPDATE public.sections SET content = jsonb_build_object(
  'fr', COALESCE(content->'fr', content),
  'es', (COALESCE(content->'fr', content) - 'title' - 'body') ||
    jsonb_build_object('title', 'Contacto', 'body', COALESCE((COALESCE(content->'fr', content)->>'body'), ''))
) WHERE key = 'contact' AND content ? 'fr' = false AND content ? 'es' = false;

-- Footer
UPDATE public.sections SET content = jsonb_build_object(
  'fr', COALESCE(content->'fr', content),
  'es', (COALESCE(content->'fr', content) - 'text') ||
    jsonb_build_object('text', 'Copyright ©2026 Julie Rosali | Todos los derechos reservados.')
) WHERE key = 'footer' AND content ? 'fr' = false AND content ? 'es' = false;

-- social, streaming, style : pas de textes à traduire, on duplique fr en es
UPDATE public.sections SET content = jsonb_build_object(
  'fr', COALESCE(content->'fr', content),
  'es', COALESCE(content->'es', COALESCE(content->'fr', content))
) WHERE key IN ('social', 'streaming', 'style') AND content ? 'fr' = false AND content ? 'es' = false;
