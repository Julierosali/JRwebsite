# Site Julie Rosali

Site vitrine une page pour l'artiste Julie Rosali : présentation, nouvel album, lecteur Spotify, clips, galerie portrait, contact. Back-office admin (Supabase Auth) pour modifier, masquer et réordonner les sections.

## Stack

- **Next.js 14** (App Router)
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

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

**Important :** n’utiliser que l’**URL** et la **clé anon** dans le frontend. Ne jamais mettre la **service role key** dans le code ou dans Vercel (sécurité).

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
