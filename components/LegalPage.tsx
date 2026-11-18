import Link from 'next/link';

/** Mise en page commune des pages légales (rendu serveur, sans JavaScript). */
export function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient">
      <header className="border-b border-white/20 bg-black/40">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <Link href="/" className="rounded border border-white/40 px-4 py-2 text-sm font-medium transition hover:bg-white/20">
            ← Accueil
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-10">
        <article className="rounded-xl bg-black/40 p-6 leading-relaxed text-white/90 md:p-10 [&_h2]:mb-2 [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-white [&_li]:ml-5 [&_li]:list-disc [&_p]:mb-3 [&_a]:underline">
          <h1 className="mb-6 text-3xl font-bold text-white">{title}</h1>
          {children}
        </article>
      </main>
    </div>
  );
}
