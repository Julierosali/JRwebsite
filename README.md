# Site Julie Rosali

Site vitrine une page pour l'artiste Julie Rosali : présentation, nouvel album, lecteur Spotify, clips, galerie portrait, contact. Back-office admin (Supabase Auth) pour modifier, masquer et réordonner les sections.

## Stack

- **Next.js 15** (App Router, React 19) — pages rendues côté serveur et régénérées toutes les 60 s (ISR)
- **Supabase** : base de données, auth, storage
- **Tailwind CSS** + **Framer Motion**
- **Déploiement** : Vercel

## Configuration

### 1. Supabase

1. Créer un projet sur [supabase.com](https://supabase.com).
2. Dans l’éditeur SQL du projet, exécuter le fichier `supabase/schema.sql` (tables, RLS, bucket, données initiales).
3. Dans **Authentication > Providers**, activer **Email** si besoin.
4. Créer un utilisateur (Auth > Users > Add user) puis l’ajouter comme admin :
   ```sql
   INSERT INTO public.admin_users (id) VALUES ('uuid-de-l-utilisateur');
   ```
   (Récupérer l’UUID dans Authentication > Users.)

### 2. Variables d’environnement

Créer `.env.local` à la racine (ou configurer les variables dans Vercel) :

Voir `.env.local.example` pour la liste complète :

| Variable | Rôle |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Accès public Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | **Serveur uniquement** (API statistiques). À mettre dans Vercel, jamais dans du code client. |
| `NEXT_PUBLIC_SITE_URL` | Vraie adresse du site (canonical, sitemap, JSON-LD). Par défaut : domaine de production Vercel. |
| `ANALYTICS_IP_SALT` | Sel du hash des IP |
| `CRON_SECRET` | Protège la tâche planifiée (`vercel.json`) qui supprime les statistiques de plus de 3 mois |

### Sécurité Supabase

- Exécuter `supabase/security_hardening_migration.sql` (écriture du stockage réservée aux admins, réglages non lisibles publiquement, suppression des IP en clair).
- Dans **Authentication > Sign In / Providers**, désactiver **Allow new users to sign up** : les comptes admin se créent à la main.

### 3. Lancer en local

```bash
npm install
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

### 4. Déploiement Vercel

1. Pousser le code sur GitHub.
2. Sur [vercel.com](https://vercel.com), **New Project** et importer le dépôt.
3. Ajouter les variables d’environnement : `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Déployer.

## Admin

- URL : `/admin`
- Connexion avec l’email/mot de passe du compte Supabase ajouté dans `admin_users`.
- Une fois connecté : sur la page d’accueil, boutons ↑ ↓ 👁 ✎ sur chaque section pour réordonner, masquer ou modifier le contenu.

## Structure des sections (Supabase)

Les contenus sont dans la table `sections` (champ `content` en JSON). Les images peuvent être hébergées dans le bucket Supabase Storage `site-images` ; mettre l’URL publique dans les champs prévus (pochette, photo présentation, galerie, etc.).
