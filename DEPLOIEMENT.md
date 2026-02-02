# Déploiement en production (Vercel)

## Mise en prod rapide (repo déjà sur GitHub)

1. Va sur **[vercel.com/new](https://vercel.com/new)** et connecte-toi.
2. **Import Git Repository** → choisis **Julierosali/JRwebsite** (ou connecte GitHub si besoin).
3. **Configure Project** : garde les réglages par défaut (Framework: Next.js).
4. **Environment Variables** : ajoute avant de déployer :
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://xnldksrwfsfxgemzkfrs.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = *(copie depuis ton `.env.local`)*
5. Clique sur **Deploy**. Quand c’est terminé, ton site est en ligne sur `https://jrwebsite-xxx.vercel.app` (ou un nom similaire).

---

## 1. Prérequis

- Compte [Vercel](https://vercel.com)
- Projet Supabase déjà configuré (URL + clé anon)

## 2. Variables d'environnement

Dans Vercel : **Project → Settings → Environment Variables**, ajoute :

| Nom | Valeur | Environnement |
|-----|--------|---------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xnldksrwfsfxgemzkfrs.supabase.co` | Production (et Preview si besoin) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | *(ta clé anon Supabase)* | Production (et Preview si besoin) |

Tu peux copier les valeurs depuis ton `.env.local` (ne commite jamais ce fichier).

## 3. Déployer

### Option A : Via le site Vercel

1. Va sur [vercel.com](https://vercel.com) et connecte-toi.
2. **Add New → Project**.
3. Importe le dépôt Git du projet (GitHub / GitLab / Bitbucket).
4. Vercel détecte Next.js : garde les réglages par défaut.
5. Ajoute les variables d’environnement (voir ci-dessus).
6. Clique sur **Deploy**.

### Option B : Via la CLI Vercel

```bash
npm i -g vercel
cd "c:\Users\Windows\Documents\CREATION WEB\Julie Rosali Website"
vercel
```

Suis les questions (lien au projet existant ou nouveau). Ensuite, ajoute les variables dans le dashboard Vercel (Settings → Environment Variables).

## 4. Après le déploiement

- L’URL de prod sera du type : `https://ton-projet.vercel.app`.
- Tu peux configurer un nom de domaine personnalisé dans Vercel (Settings → Domains).
- Les images uploadées passent par Supabase Storage ; rien à changer côté Vercel pour ça.

## 5. Si tu n’as pas encore poussé le code sur Git

1. Crée un dépôt sur GitHub (ou autre).
2. Dans le dossier du projet :
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/TON_USER/TON_REPO.git
   git push -u origin main
   ```
3. Puis connecte ce dépôt à Vercel comme en Option A.
