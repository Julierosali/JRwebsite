-- Migration : ajouter user_agent à analytics_sessions (pour identifier et filtrer/purger les bots)
-- Exécuter une fois dans l'éditeur SQL Supabase si la table existe déjà sans cette colonne.

ALTER TABLE public.analytics_sessions
  ADD COLUMN IF NOT EXISTS user_agent text;

COMMENT ON COLUMN public.analytics_sessions.user_agent IS 'User-Agent de la requête (pour détecter bots/crawlers).';
