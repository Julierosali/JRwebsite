'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAdmin } from '@/context/AdminContext';
import { supabase } from '@/lib/supabase';

type KPIs = {
  uniqueVisitors: number;
  totalViews: number;
  avgDurationSeconds: number;
  bounceRate: number;
  pagesPerVisit: number;
};

type AnalyticsData = {
  filter?: { include: string[]; exclude: string[]; excludeHashes: string[] };
  kpis: KPIs;
  topContents: { path: string; count: number }[];
  byCountry: { country: string; count: number }[];
  byCity: { city: string; count: number }[];
  topClicks: { element_id: string; count: number }[];
  bySource: { referrer: string; browser: string; count: number }[];
  visitsByPage: { path: string; count: number }[];
  visitors: { ip_hash: string; ip: string | null; country: string; city: string; sessionCount: number }[];
  period: { from: string; to: string };
  page: number;
  perPage: number;
};

const TABS = [
  { id: 'top', label: 'Top contenus' },
  { id: 'country', label: 'Par pays' },
  { id: 'city', label: 'Par ville' },
  { id: 'clicks', label: 'Éléments les plus cliqués' },
  { id: 'source', label: 'Source (navigateur)' },
  { id: 'visits', label: 'Visites par page' },
  { id: 'visitors', label: 'Visiteurs' },
  { id: 'maintenance', label: 'Maintenance' },
] as const;

function fetchWithAuth(url: string, options?: RequestInit) {
  return supabase.auth.getSession().then(({ data: { session } }) => {
    const headers: HeadersInit = { ...options?.headers };
    if (session?.access_token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${session.access_token}`;
    }
    return fetch(url, { ...options, headers });
  });
}

const PERIOD_OPTIONS = [
  { value: '7days', label: '7 derniers jours' },
  { value: '30days', label: '30 derniers jours' },
  { value: '90days', label: '90 derniers jours' },
  { value: 'current_month', label: 'Mois en cours' },
  { value: 'last_month', label: 'Mois précédent' },
] as const;

export function AnalyticsDashboard({ onClose }: { onClose: () => void }) {
  const { user } = useAdmin();
  const [tab, setTab] = useState<string>('top');
  const [periodKey, setPeriodKey] = useState<string>('current_month');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filterInclude, setFilterInclude] = useState('');
  const [filterExclude, setFilterExclude] = useState('');
  const [filterExcludeHashes, setFilterExcludeHashes] = useState('');
  const [filterSaving, setFilterSaving] = useState(false);
  const [excludeHashFeedback, setExcludeHashFeedback] = useState<string | null>(null);

  const [selectedHashes, setSelectedHashes] = useState<Set<string>>(new Set());
  const [visitorFeedback, setVisitorFeedback] = useState<string | null>(null);
  const [purgeFeedback, setPurgeFeedback] = useState<string | null>(null);
  const filterLoadedRef = useRef(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (periodKey === '7days' || periodKey === '30days' || periodKey === '90days') {
      params.set('days', periodKey === '7days' ? '7' : periodKey === '30days' ? '30' : '90');
    } else {
      params.set('period', periodKey);
    }
    params.set('page', String(page));
    const res = await fetchWithAuth(`/api/admin/analytics?${params}`);
    if (!res.ok) {
      setError(res.status === 401 ? 'Non autorisé' : await res.text());
      setLoading(false);
      return;
    }
    const json = await res.json();
    setData(json);
    if (json.filter && !filterLoadedRef.current) {
      filterLoadedRef.current = true;
      setFilterInclude((json.filter.include || []).join('\n'));
      setFilterExclude((json.filter.exclude || []).join('\n'));
      setFilterExcludeHashes((json.filter.excludeHashes || []).join('\n'));
    }
    setLoading(false);
  }, [user, periodKey, page]);

  useEffect(() => {
    load();
  }, [load]);

  const saveFilter = async () => {
    if (!user) return;
    setFilterSaving(true);
    const include = filterInclude.trim().split(/\n/).map((s) => s.trim()).filter(Boolean);
    const exclude = filterExclude.trim().split(/\n/).map((s) => s.trim()).filter(Boolean);
    const excludeHashes = filterExcludeHashes.trim().split(/\n/).map((s) => s.trim()).filter(Boolean);
    const res = await fetchWithAuth('/api/admin/analytics/filter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ include, exclude, excludeHashes }),
    });
    setFilterSaving(false);
    if (res.ok) {
      load();
    }
  };

  const purgeByHashes = async () => {
    if (!user) return;
    const hashes = filterExcludeHashes.trim().split(/\n/).map((s) => s.trim()).filter(Boolean);
    if (hashes.length === 0) return;
    const res = await fetchWithAuth('/api/admin/analytics/purge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hashes }),
    });
    if (!res.ok) return;
    setFilterExcludeHashes('');
    setExcludeHashFeedback(`${hashes.length} session(s) purgée(s). Liste hash vidée.`);
    setTimeout(() => setExcludeHashFeedback(null), 4000);
    load();
  };

  const addToExcludeHash = (hash: string) => {
    setFilterExcludeHashes((prev) => (prev ? `${prev}\n${hash}` : hash));
    setVisitorFeedback(`${hash.slice(0, 12)}… ajouté aux hash exclus`);
    setTimeout(() => setVisitorFeedback(null), 3000);
  };

  const addVisitorsToExclude = () => {
    selectedHashes.forEach((h) => {
      setFilterExcludeHashes((prev) => (prev ? `${prev}\n${h}` : h));
    });
    setVisitorFeedback(`${selectedHashes.size} visiteur(s) ajouté(s) aux hash exclus`);
    setTimeout(() => setVisitorFeedback(null), 3000);
  };

  const selectSameCountryCity = () => {
    const first = data?.visitors.find((v) => selectedHashes.has(v.ip_hash));
    if (!first || !data) return;
    const next = new Set<string>();
    data.visitors.forEach((v) => {
      if (v.country === first.country && v.city === first.city) next.add(v.ip_hash);
    });
    setSelectedHashes(next);
  };

  const runPurge = async (mode: '3months' | '1month' | 'all' | 'ips', ips?: string[]) => {
    if (!user) return;
    setPurgeFeedback(null);
    let url = '/api/admin/analytics/purge';
    let body: string | undefined;
    if (mode === 'all') url += '?all=1';
    else if (mode === '1month') url += '?olderThan=1month';
    else if (mode === 'ips' && ips && ips.length > 0) {
      body = JSON.stringify({ ips });
    }
    try {
      const res = await fetchWithAuth(url, {
        method: 'POST',
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPurgeFeedback(`Erreur : ${json.error || res.statusText || res.status}`);
        setTimeout(() => setPurgeFeedback(null), 6000);
        return;
      }
      const msg = json.purged
        ? (json.purged === 'all' ? 'Toutes les stats ont été purgées.' : `${json.purged} — ${json.count ?? 0} session(s) supprimée(s).`)
        : 'Purge effectuée.';
      setPurgeFeedback(msg);
      setTimeout(() => setPurgeFeedback(null), 5000);
      load();
    } catch (e) {
      setPurgeFeedback(`Erreur : ${e instanceof Error ? e.message : 'Purge impossible'}`);
      setTimeout(() => setPurgeFeedback(null), 6000);
    }
  };

  const perPage = 20;
  const pathLabel = (p: string) => (p === '/' || p === '') ? 'home' : (p || 'home');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl bg-blue/95 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold">Statistiques</h3>
            <p className="mt-1 text-sm text-white/70">Analytics sans cookies, respectueux de la vie privée.</p>
          </div>
          <button
            type="button"
            onClick={() => { setTab('maintenance'); setPage(1); }}
            className={`shrink-0 rounded px-3 py-1.5 text-sm ${
              tab === 'maintenance'
                ? 'bg-red-600 text-white'
                : 'bg-red-900/50 text-red-200 hover:bg-red-900/70'
            }`}
          >
            Maintenance
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <label className="flex items-center gap-2 text-sm text-white/90">
            Période
            <select
              value={periodKey}
              onChange={(e) => { setPeriodKey(e.target.value); setPage(1); }}
              className="rounded border border-white/30 bg-black/30 px-3 py-1.5 text-sm text-white"
            >
              {PERIOD_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {error && <p className="mt-2 text-sm text-red-300">{error}</p>}
        {visitorFeedback && <p className="mt-2 text-sm text-green-300">{visitorFeedback}</p>}
        {excludeHashFeedback && <p className="mt-2 text-sm text-green-300">{excludeHashFeedback}</p>}
        {purgeFeedback && tab !== 'maintenance' && <p className="mt-2 text-sm text-green-300">{purgeFeedback}</p>}

        <div className="mt-4 flex flex-wrap gap-1 border-b border-white/20 pb-2">
          {TABS.filter((t) => t.id !== 'maintenance').map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => { setTab(t.id); setPage(1); }}
              className={`rounded px-3 py-1.5 text-sm ${
                tab === t.id ? 'bg-violet text-white' : 'bg-white/10 text-white/80 hover:bg-white/20'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading && !data && <div className="mt-4 h-12 w-12 animate-spin rounded-full border-4 border-violet border-t-transparent" />}

        {data && data.kpis.uniqueVisitors === 0 && (
          <div className="mt-4 rounded-lg border border-amber-500/50 bg-amber-900/20 p-4 text-sm text-amber-200">
            <p className="font-medium">Aucune donnée pour cette période</p>
            <p className="mt-2 text-white/80">Pour que les visites s’enregistrent :</p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-white/70">
              <li><strong>SUPABASE_SERVICE_ROLE_KEY</strong> doit être défini (Vercel → Settings → Environment Variables, ou .env.local en dev)</li>
              <li>Le schéma analytics doit être exécuté dans Supabase (SQL Editor → supabase/analytics_schema.sql)</li>
              <li>Visitez le site <strong>déconnecté</strong> (navigation privée ou autre navigateur) : les visites des admins connectés ne sont pas enregistrées</li>
            </ul>
          </div>
        )}

        {data && tab !== 'maintenance' && tab !== 'visitors' && (
          <div className="mt-4">
            <div className="mb-4 grid grid-cols-2 gap-2 md:grid-cols-5">
              <div className="rounded bg-black/30 p-2 text-center">
                <div className="text-lg font-bold">{data.kpis.uniqueVisitors}</div>
                <div className="text-xs text-white/70">Visiteurs uniques</div>
              </div>
              <div className="rounded bg-black/30 p-2 text-center">
                <div className="text-lg font-bold">{data.kpis.totalViews}</div>
                <div className="text-xs text-white/70">Vues totales</div>
              </div>
              <div className="rounded bg-black/30 p-2 text-center">
                <div className="text-lg font-bold">{data.kpis.avgDurationSeconds}s</div>
                <div className="text-xs text-white/70">Temps moyen/page</div>
              </div>
              <div className="rounded bg-black/30 p-2 text-center">
                <div className="text-lg font-bold">{data.kpis.bounceRate}%</div>
                <div className="text-xs text-white/70">Taux rebond</div>
              </div>
              <div className="rounded bg-black/30 p-2 text-center">
                <div className="text-lg font-bold">{data.kpis.pagesPerVisit}</div>
                <div className="text-xs text-white/70">Pages/visite</div>
              </div>
            </div>

            {tab === 'top' && (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="py-2">Page</th>
                    <th className="py-2">Vues</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topContents.map((r) => (
                    <tr key={r.path} className="border-b border-white/10">
                      <td className="py-1.5">{pathLabel(r.path)}</td>
                      <td className="py-1.5">{r.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {tab === 'country' && (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="py-2">Pays</th>
                    <th className="py-2">Visites</th>
                  </tr>
                </thead>
                <tbody>
                  {data.byCountry.map((r) => (
                    <tr key={r.country} className="border-b border-white/10">
                      <td className="py-1.5">{r.country}</td>
                      <td className="py-1.5">{r.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {tab === 'city' && (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="py-2">Ville</th>
                    <th className="py-2">Visites</th>
                  </tr>
                </thead>
                <tbody>
                  {data.byCity.map((r) => (
                    <tr key={r.city} className="border-b border-white/10">
                      <td className="py-1.5">{r.city}</td>
                      <td className="py-1.5">{r.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {tab === 'clicks' && (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="py-2">Élément</th>
                    <th className="py-2">Clics</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topClicks.map((r) => (
                    <tr key={r.element_id} className="border-b border-white/10">
                      <td className="py-1.5">{r.element_id}</td>
                      <td className="py-1.5">{r.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {tab === 'source' && (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="py-2">Source</th>
                    <th className="py-2">Navigateur</th>
                    <th className="py-2">Visites</th>
                  </tr>
                </thead>
                <tbody>
                  {data.bySource.map((r, i) => (
                    <tr key={i} className="border-b border-white/10">
                      <td className="py-1.5">{r.referrer || 'direct'}</td>
                      <td className="py-1.5">{r.browser}</td>
                      <td className="py-1.5">{r.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {tab === 'visits' && (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="py-2">Page</th>
                    <th className="py-2">Visites</th>
                  </tr>
                </thead>
                <tbody>
                  {data.visitsByPage.map((r) => (
                    <tr key={r.path} className="border-b border-white/10">
                      <td className="py-1.5">{pathLabel(r.path)}</td>
                      <td className="py-1.5">{r.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <div className="mt-4 flex justify-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded bg-white/20 px-3 py-1 text-sm disabled:opacity-50"
              >
                Précédent
              </button>
              <span className="py-1 text-sm text-white/80">Page {data.page}</span>
              <button
                type="button"
                onClick={() => setPage((p) => p + 1)}
                className="rounded bg-white/20 px-3 py-1 text-sm"
              >
                Suivant
              </button>
            </div>
          </div>
        )}

        {data && tab === 'visitors' && (
          <div className="mt-4">
            <div className="mb-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={selectSameCountryCity}
                className="rounded bg-white/20 px-2 py-1 text-xs hover:bg-white/30"
              >
                Sélectionner même pays+ville que la sélection
              </button>
              <button
                type="button"
                onClick={addVisitorsToExclude}
                disabled={selectedHashes.size === 0}
                className="rounded bg-white/20 px-2 py-1 text-xs disabled:opacity-50 hover:bg-white/30"
              >
                Exclure les visiteurs sélectionnés ({selectedHashes.size})
              </button>
              <button
                type="button"
                onClick={() => setSelectedHashes(new Set())}
                className="rounded bg-white/20 px-2 py-1 text-xs hover:bg-white/30"
              >
                Désélectionner tout
              </button>
            </div>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="w-8 py-2" />
                  <th className="py-2">IP</th>
                  <th className="py-2">Pays</th>
                  <th className="py-2">Ville</th>
                  <th className="py-2">Visites</th>
                  <th className="py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {data.visitors.map((v) => (
                  <tr key={v.ip_hash} className="border-b border-white/10">
                    <td className="py-1.5">
                      <input
                        type="checkbox"
                        checked={selectedHashes.has(v.ip_hash)}
                        onChange={(e) => {
                          setSelectedHashes((prev) => {
                            const next = new Set(prev);
                            if (e.target.checked) next.add(v.ip_hash);
                            else next.delete(v.ip_hash);
                            return next;
                          });
                        }}
                        className="rounded border-white/30"
                      />
                    </td>
                    <td className="py-1.5 font-mono text-xs">{v.ip ?? '—'}</td>
                    <td className="py-1.5">{v.country}</td>
                    <td className="py-1.5">{v.city}</td>
                    <td className="py-1.5">{v.sessionCount}</td>
                    <td className="py-1.5">
                      {v.ip ? (
                        <button
                          type="button"
                          onClick={() => addToExcludeHash(v.ip_hash)}
                          className="text-xs text-red-300 hover:underline"
                        >
                          Exclure ce visiteur
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => addToExcludeHash(v.ip_hash)}
                          className="text-xs text-red-300 hover:underline"
                        >
                          Exclure ce visiteur
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-4 flex justify-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded bg-white/20 px-3 py-1 text-sm disabled:opacity-50"
              >
                Précédent
              </button>
              <span className="py-1 text-sm text-white/80">Page {data.page}</span>
              <button type="button" onClick={() => setPage((p) => p + 1)} className="rounded bg-white/20 px-3 py-1 text-sm">
                Suivant
              </button>
            </div>
          </div>
        )}

        {tab === 'maintenance' && (
          <div className="mt-4 space-y-4">
            {purgeFeedback && (
              <p className={`rounded border px-3 py-2 text-sm ${purgeFeedback.startsWith('Erreur') ? 'border-red-400/50 bg-red-900/20 text-red-200' : 'border-green-400/50 bg-green-900/20 text-green-200'}`}>
                {purgeFeedback}
              </p>
            )}
            <div className="rounded border border-white/20 p-4">
              <p className="text-sm font-medium text-white/90">Purger les données</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => runPurge('3months')}
                  className="rounded bg-red-900/40 px-3 py-2 text-sm text-red-200 hover:bg-red-900/60"
                >
                  Purger les données de + 3 mois
                </button>
                <button
                  type="button"
                  onClick={() => runPurge('1month')}
                  className="rounded bg-red-900/40 px-3 py-2 text-sm text-red-200 hover:bg-red-900/60"
                >
                  Purger les données de +1 mois
                </button>
                <button
                  type="button"
                  onClick={() => runPurge('all')}
                  className="rounded bg-red-900/60 px-3 py-2 text-sm text-red-200 hover:bg-red-900/80"
                >
                  Purger toutes les stats
                </button>
              </div>
            </div>
            <div className="rounded border border-white/20 p-4">
              <p className="text-sm font-medium text-white/90">Purger par IP</p>
              <p className="mt-1 text-xs text-white/60">Une IP par ligne.</p>
              <textarea
                id="purge-ips"
                rows={3}
                className="mt-2 w-full rounded border border-white/30 bg-black/30 px-2 py-1 font-mono text-sm text-white"
                placeholder="127.0.0.1"
              />
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const ta = document.getElementById('purge-ips') as HTMLTextAreaElement;
                    if (ta) ta.value = '';
                  }}
                  className="rounded bg-white/20 px-2 py-1 text-xs hover:bg-white/30"
                >
                  Vider
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const res = await fetchWithAuth('/api/admin/analytics/my-ip');
                    if (res.ok) {
                      const { ip } = await res.json();
                      const ta = document.getElementById('purge-ips') as HTMLTextAreaElement;
                      if (ta) ta.value = ip || '';
                    }
                  }}
                  className="rounded bg-white/20 px-2 py-1 text-xs hover:bg-white/30"
                >
                  Utiliser mon IP
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const ta = document.getElementById('purge-ips') as HTMLTextAreaElement;
                    const ips = (ta?.value || '').trim().split(/\n/).map((s) => s.trim()).filter(Boolean);
                    runPurge('ips', ips);
                    if (ta) ta.value = '';
                  }}
                  className="rounded bg-red-900/40 px-2 py-1 text-xs text-red-200 hover:bg-red-900/60"
                >
                  Purger les tracks de ces IP
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 border-t border-white/20 pt-4">
            <p className="text-sm font-medium text-white/90">Filtre par IP</p>
            <div className="mt-2 grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-xs text-white/70">Inclure uniquement ces IP (une par ligne)</label>
                <textarea
                  value={filterInclude}
                  onChange={(e) => setFilterInclude(e.target.value)}
                  rows={2}
                  className="mt-1 w-full rounded border border-white/30 bg-black/30 px-2 py-1 font-mono text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-white/70">Exclure ces IP (une par ligne)</label>
                <textarea
                  value={filterExclude}
                  onChange={(e) => setFilterExclude(e.target.value)}
                  rows={2}
                  className="mt-1 w-full rounded border border-white/30 bg-black/30 px-2 py-1 font-mono text-sm text-white"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-xs text-white/70">Exclure Hash (ajoutés par « Exclure ce visiteur » ou « Exclure les visiteurs sélectionnés »)</label>
              <textarea
                value={filterExcludeHashes}
                onChange={(e) => setFilterExcludeHashes(e.target.value)}
                rows={3}
                className="mt-1 w-full rounded border border-white/30 bg-black/30 px-2 py-1 font-mono text-xs text-white"
                placeholder="Un hash par ligne"
              />
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const text = filterExcludeHashes.trim();
                    if (text) navigator.clipboard.writeText(text);
                  }}
                  className="rounded bg-white/20 px-2 py-1 text-xs hover:bg-white/30"
                >
                  Copier les hash
                </button>
                <button
                  type="button"
                  onClick={purgeByHashes}
                  disabled={!filterExcludeHashes.trim()}
                  className="rounded bg-red-900/40 px-2 py-1 text-xs text-red-200 disabled:opacity-50 hover:bg-red-900/60"
                >
                  Purge Hash (supprimer en base puis vider)
                </button>
                <button
                  type="button"
                  onClick={saveFilter}
                  disabled={filterSaving}
                  className="rounded bg-violet px-2 py-1 text-xs disabled:opacity-50 hover:bg-violet-light"
                >
                  {filterSaving ? 'Enregistrement…' : 'Enregistrer le filtre'}
                </button>
              </div>
            </div>
          </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded bg-white/20 px-4 py-2 font-medium hover:bg-white/30"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
