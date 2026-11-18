-- ============================================
-- Durcissement sécurité / confidentialité
-- À exécuter UNE FOIS dans l'éditeur SQL Supabase (idempotent).
-- ============================================

-- Fonction utilitaire : l'utilisateur courant est-il admin ?
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid());
$$;

-- 1) Storage : seules les admins peuvent ajouter / remplacer / supprimer
--    les images (site-images) et les PDF (site-documents).
--    Avant : n'importe quel compte connecté (y compris un compte créé par un inconnu).
DROP POLICY IF EXISTS "site_images_authenticated_upload" ON storage.objects;
DROP POLICY IF EXISTS "site_images_authenticated_update" ON storage.objects;
DROP POLICY IF EXISTS "site_images_authenticated_delete" ON storage.objects;
DROP POLICY IF EXISTS "site_images_admin_insert" ON storage.objects;
DROP POLICY IF EXISTS "site_images_admin_update" ON storage.objects;
DROP POLICY IF EXISTS "site_images_admin_delete" ON storage.objects;

CREATE POLICY "site_images_admin_insert" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'site-images' AND public.is_admin());
CREATE POLICY "site_images_admin_update" ON storage.objects FOR UPDATE
  USING (bucket_id = 'site-images' AND public.is_admin());
CREATE POLICY "site_images_admin_delete" ON storage.objects FOR DELETE
  USING (bucket_id = 'site-images' AND public.is_admin());

DROP POLICY IF EXISTS "site_documents_authenticated_upload" ON storage.objects;
DROP POLICY IF EXISTS "site_documents_authenticated_update" ON storage.objects;
DROP POLICY IF EXISTS "site_documents_authenticated_delete" ON storage.objects;
DROP POLICY IF EXISTS "site_documents_admin_insert" ON storage.objects;
DROP POLICY IF EXISTS "site_documents_admin_update" ON storage.objects;
DROP POLICY IF EXISTS "site_documents_admin_delete" ON storage.objects;

CREATE POLICY "site_documents_admin_insert" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'site-documents' AND public.is_admin());
CREATE POLICY "site_documents_admin_update" ON storage.objects FOR UPDATE
  USING (bucket_id = 'site-documents' AND public.is_admin());
CREATE POLICY "site_documents_admin_delete" ON storage.objects FOR DELETE
  USING (bucket_id = 'site-documents' AND public.is_admin());

-- 2) site_settings : contient les IP de filtrage des stats → lecture réservée aux admins.
--    (Les API Next.js utilisent la clé service_role et ne sont pas concernées.)
DROP POLICY IF EXISTS "site_settings_select" ON public.site_settings;
CREATE POLICY "site_settings_select" ON public.site_settings FOR SELECT
  USING (public.is_admin());

-- 3) Confidentialité : l'IP en clair n'est plus enregistrée par le site.
--    Effacer celles déjà stockées (seul le hash reste, suffisant pour filtrer).
UPDATE public.analytics_sessions SET ip = NULL WHERE ip IS NOT NULL;
