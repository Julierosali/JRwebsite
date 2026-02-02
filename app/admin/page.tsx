'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAdmin } from '@/context/AdminContext';

export default function AdminPage() {
  const { user, isAdmin, loading, signIn, signOut } = useAdmin();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user && !isAdmin) {
      // Pas encore connecté : on reste sur la page pour afficher le formulaire
    }
    if (!loading && user && !isAdmin) {
      setError('Accès refusé. Votre compte n\'est pas administrateur.');
    }
  }, [loading, user, isAdmin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const { error: err } = await signIn(email, password);
    if (err) {
      setError(err.message ?? 'Erreur de connexion');
      return;
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-violet border-t-transparent" />
      </div>
    );
  }

  if (user && isAdmin) {
    return (
      <div className="min-h-screen bg-gradient px-4 py-12">
        <div className="mx-auto max-w-2xl rounded-xl bg-black/40 p-8 shadow-xl">
          <h1 className="text-2xl font-bold">Administration</h1>
          <p className="mt-2 text-white/80">Connecté en tant qu&apos;administrateur.</p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/"
              className="rounded bg-violet px-6 py-3 font-medium transition hover:bg-violet-light"
            >
              Voir le site
            </Link>
            <button
              type="button"
              onClick={() => signOut().then(() => router.push('/admin'))}
              className="rounded bg-white/20 px-6 py-3 font-medium transition hover:bg-white/30"
            >
              Se déconnecter
            </button>
          </div>
          <p className="mt-8 text-sm text-white/60">
            Sur le site, utilisez les boutons ↑ ↓ 👁 ✎ sur chaque section pour réordonner, masquer ou modifier le contenu.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient px-4">
      <div className="w-full max-w-md rounded-xl bg-black/40 p-8 shadow-xl">
        <h1 className="text-2xl font-bold">Connexion admin</h1>
        <p className="mt-2 text-sm text-white/80">Accès réservé aux administrateurs.</p>
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 w-full rounded border border-white/30 bg-black/30 px-4 py-3 text-white"
              placeholder="admin@exemple.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium">
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 w-full rounded border border-white/30 bg-black/30 px-4 py-3 text-white"
            />
          </div>
          {error && <p className="text-sm text-red-300">{error}</p>}
          <button
            type="submit"
            className="w-full rounded bg-violet py-3 font-medium transition hover:bg-violet-light"
          >
            Se connecter
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-white/60">
          <Link href="/" className="underline hover:no-underline">
            Retour au site
          </Link>
        </p>
      </div>
    </div>
  );
}
