# Prompt pour ajouter le filtre bots/crawlers sur un autre projet

Copie ce texte et adapte les noms (projet, routes, etc.) selon ton autre site.

---

**Demande :**

Mets en place un filtre crawlers/bots pour les analytics, comme sur [Julie Rosali / JRwebsite], avec :

1. **Toujours collecter** les visites (y compris bots) et stocker le User-Agent en base pour pouvoir filtrer ou purger plus tard.
2. Un **bouton poussoir** dans l’admin pour activer ou désactiver la prise en compte des bots dans les stats :
   - **Activé** : les stats (KPIs, listes, visiteurs) n’affichent pas les sessions identifiées comme bots (filtrage à l’affichage).
   - **Désactivé** : les stats incluent tout le monde (y compris les bots déjà enregistrés).
3. **Exclure en masse** : un bouton qui ajoute au filtre d’exclusion (ex. liste de hash) tous les `ip_hash` des sessions identifiées comme bots, pour qu’ils disparaissent des stats sans supprimer les données.
4. **Purger uniquement les traces bots** : un bouton qui supprime de la base uniquement les sessions (et leurs événements) dont le User-Agent correspond à un bot.

À faire :

1. **Détection des bots par User-Agent**
   - Créer un module (ex. `lib/bot-detection.ts`) avec une liste de motifs (Googlebot, Bingbot, curl, wget, headless, selenium, bot, crawler, spider, etc.) et une fonction `isLikelyBot(userAgent: string): boolean`.

2. **Collecte**
   - API de collecte : **toujours** enregistrer la session et les événements ; stocker le header `User-Agent` dans la table des sessions (colonne `user_agent`). Ne pas rejeter les bots à la collecte.

3. **Affichage des stats**
   - API admin analytics (GET) : lire le réglage `analytics_exclude_bots` (ex. dans `site_settings`). Si `excludeBots === true`, après récupération des sessions, filtrer côté serveur celles pour lesquelles `isLikelyBot(session.user_agent)` est vrai, puis calculer KPIs, listes (pays/ville, visiteurs, etc.) sur ce sous-ensemble. Si `excludeBots === false`, ne pas filtrer (tout afficher).

4. **Réglage activable/désactivable**
   - Stocker en base (ex. `site_settings`, clé `analytics_exclude_bots`, valeur `{ excludeBots: true }` ou `false`). Par défaut : `excludeBots: true`.
   - Dashboard : bouton du type « Exclure crawlers / bots des stats : **Activé** » / « **Désactivé** » qui appelle un endpoint (ex. `POST /api/admin/analytics/settings` avec `{ excludeBots: boolean }`) et recharge les stats.

5. **Exclure en masse les bots**
   - Endpoint (ex. `GET /api/admin/analytics/bot-hashes`) qui retourne la liste des `ip_hash` des sessions pour lesquelles `isLikelyBot(user_agent)` est vrai.
   - Dans le dashboard (onglet Maintenance ou Filtre), bouton « Exclure en masse les bots » : appeler cet endpoint, fusionner les hash avec la liste d’exclusion actuelle (ex. `excludeHashes`), puis enregistrer le filtre (POST sur l’endpoint de sauvegarde du filtre). Les visiteurs bots disparaissent des stats sans suppression en base.

6. **Purger uniquement les traces bots**
   - Endpoint de purge (ex. `POST /api/admin/analytics/purge?bots=1`) : récupérer toutes les sessions ayant un `user_agent`, filtrer en JS celles où `isLikelyBot(user_agent)`, supprimer les événements puis les sessions correspondantes (par lots si besoin). Retourner le nombre de sessions supprimées.

**À ne pas inclure :** pas de bouton ni de purge « garder uniquement aujourd’hui » / « anciennes traces » (purge par date type 1 jour). Les purges proposées sont : par période (ex. +1 mois, +3 mois), tout purger, et purger uniquement les bots.

Adapte les noms de routes, tables et clés à la structure de mon projet (Next.js, Supabase, etc.).

---

**SQL (nouveau projet ou migration)**

- Ajouter la colonne `user_agent` à la table des sessions (si elle n’existe pas) :

```sql
ALTER TABLE public.analytics_sessions
  ADD COLUMN IF NOT EXISTS user_agent text;
```

- Réglage par défaut (exclure bots des stats) :

```sql
INSERT INTO public.site_settings (key, value) VALUES
  ('analytics_exclude_bots', '{"excludeBots":true}'::jsonb)
ON CONFLICT (key) DO NOTHING;
```

---

*Référence : implémentation dans le projet Julie Rosali Website (JRwebsite).*
