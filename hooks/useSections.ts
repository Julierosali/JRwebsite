'use client';

import { useState, useCallback } from 'react';
import { supabase, Section } from '@/lib/supabase';

const REORDERABLE_KEYS = ['album', 'presentation', 'player', 'clips', 'scene', 'presse', 'portrait', 'contact'];

/**
 * Sections du site. Les données initiales viennent du serveur (SSR/ISR) :
 * pas de chargement côté navigateur au premier affichage.
 */
export function useSections(initialSections: Section[]) {
  const [sections, setSections] = useState<Section[]>(initialSections);

  const refetch = useCallback(async () => {
    const { data, error } = await supabase
      .from('sections')
      .select('*')
      .order('sort_order', { ascending: true });
    if (!error && data) setSections(data as Section[]);
    return error;
  }, []);

  const updateSection = useCallback(
    async (id: string, updates: Partial<Pick<Section, 'sort_order' | 'visible' | 'content'>>) => {
      const { error } = await supabase.from('sections').update(updates).eq('id', id);
      if (error) {
        window.alert(`Enregistrement impossible : ${error.message}`);
        return error;
      }
      await refetch();
      return null;
    },
    [refetch]
  );

  const moveSection = useCallback(
    async (index: number, direction: 'up' | 'down') => {
      const filtered = sections.filter((s) => REORDERABLE_KEYS.includes(s.key));
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= filtered.length) return;
      // Renumérote toute la liste pour éviter les sort_order identiques (swap sans effet).
      const reordered = [...filtered];
      [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
      const base = Math.min(...filtered.map((s) => s.sort_order));
      const changes = reordered
        .map((s, i) => ({ id: s.id, sort_order: base + i, old: s.sort_order }))
        .filter((c) => c.sort_order !== c.old);
      const results = await Promise.all(
        changes.map((c) => supabase.from('sections').update({ sort_order: c.sort_order }).eq('id', c.id))
      );
      const failed = results.find((r) => r.error);
      if (failed?.error) window.alert(`Réorganisation impossible : ${failed.error.message}`);
      await refetch();
    },
    [sections, refetch]
  );

  return { sections, refetch, updateSection, moveSection };
}
