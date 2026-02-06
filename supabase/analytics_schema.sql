-- ============================================
-- Analytics web custom (sans cookies, vie privée)
-- Exécuter dans l'éditeur SQL Supabase
-- ============================================

-- Table des sessions (visiteurs non authentifiés)
CREATE TABLE IF NOT EXISTS public.analytics_sessions (
  session_id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  ip_hash text NOT NULL,
  ip text,
  country text,
  city text,
  referrer text,
  browser text,
  device text,
  os text,
  user_agent text,
  is_authenticated boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_analytics_sessions_created_at ON public.analytics_sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_ip_hash ON public.analytics_sessions(ip_hash);
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_is_auth ON public.analytics_sessions(is_authenticated) WHERE is_authenticated = false;

COMMENT ON TABLE public.analytics_sessions IS 'Sessions de visite (non authentifiés). ip_hash = SHA256 salé de l''IP.';
COMMENT ON COLUMN public.analytics_sessions.ip IS 'Optionnel, pour affichage admin uniquement.';

-- Table des événements (pageview, click)
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id uuid NOT NULL REFERENCES public.analytics_sessions(session_id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('pageview', 'click')),
  path text NOT NULL,
  element_id text,
  duration int,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON public.analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON public.analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON public.analytics_events(event_type);

COMMENT ON TABLE public.analytics_events IS 'Événements par session. CASCADE delete quand session supprimée.';
COMMENT ON COLUMN public.analytics_events.element_id IS 'Pour clics : type|détail, ex. menu|Contact.';

-- Table des réglages site (filtre IP analytics)
CREATE TABLE IF NOT EXISTS public.site_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.site_settings IS 'Réglages clé/valeur (ex. analytics_ip_filter).';

-- Trigger updated_at sur analytics_sessions
CREATE OR REPLACE FUNCTION public.set_analytics_session_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS analytics_sessions_updated_at ON public.analytics_sessions;
CREATE TRIGGER analytics_sessions_updated_at
  BEFORE UPDATE ON public.analytics_sessions
  FOR EACH ROW EXECUTE FUNCTION public.set_analytics_session_updated_at();

-- RLS : écriture via service role / API uniquement (pas d'accès direct client)
ALTER TABLE public.analytics_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Lecture/écriture pour service_role (API Next.js avec clé service_role)
-- Les policies ci-dessous autorisent tout pour authenticated + admin (dashboard) et anon pour insert (collect)
-- En pratique : collect API utilise service_role pour insérer ; admin API utilise service_role ou on crée des policies.

-- Lecture publique des sessions/events désactivée par défaut. L'API Next.js utilisera la clé service_role.
DROP POLICY IF EXISTS "analytics_sessions_select" ON public.analytics_sessions;
CREATE POLICY "analytics_sessions_select"
  ON public.analytics_sessions FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "analytics_events_select" ON public.analytics_events;
CREATE POLICY "analytics_events_select"
  ON public.analytics_events FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid())
  );

-- Insert/Update/Delete : l'API collect utilise SUPABASE_SERVICE_ROLE_KEY (bypass RLS).
-- Purge depuis le dashboard : l'API admin utilise le JWT admin (lecture via policy ci-dessus).

-- site_settings : lecture publique (pour API), écriture par admins
DROP POLICY IF EXISTS "site_settings_select" ON public.site_settings;
CREATE POLICY "site_settings_select"
  ON public.site_settings FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "site_settings_insert" ON public.site_settings;
CREATE POLICY "site_settings_insert"
  ON public.site_settings FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "site_settings_update" ON public.site_settings;
CREATE POLICY "site_settings_update"
  ON public.site_settings FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));

-- Insert initial analytics_ip_filter et analytics_exclude_bots (exécuter en tant qu'admin ou avec service_role)
INSERT INTO public.site_settings (key, value) VALUES
  ('analytics_ip_filter', '{"include":[],"exclude":[],"excludeHashes":[]}'::jsonb),
  ('analytics_exclude_bots', '{"excludeBots":true}'::jsonb)
ON CONFLICT (key) DO NOTHING;
-- Si l'INSERT échoue (RLS), créer la ligne manuellement en SQL après connexion admin.
