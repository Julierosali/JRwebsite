'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase, Section } from '@/lib/supabase';

export function useSections() {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: e } = await supabase
        .from('sections')
        .select('*')
        .order('sort_order', { ascending: true });
      if (e) {
        setError(e as Error);
        setSections([]);
      } else {
        setSections((data as Section[]) ?? []);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erreur de chargement'));
      setSections([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const updateSection = useCallback(async (id: string, updates: Partial<Pick<Section, 'sort_order' | 'visible' | 'content'>>) => {
    const { error: e } = await supabase.from('sections').update(updates).eq('id', id);
    if (!e) await fetch();
    return e;
  }, [fetch]);

  const reorderableKeys = ['album', 'presentation', 'player', 'clips', 'scene', 'portrait', 'contact'];

  const moveSection = useCallback(async (index: number, direction: 'up' | 'down') => {
    const filtered = sections.filter((s) => reorderableKeys.includes(s.key));
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= filtered.length) return;
    const sectionA = filtered[index];
    const sectionB = filtered[targetIndex];
    await supabase.from('sections').update({ sort_order: sectionB.sort_order }).eq('id', sectionA.id);
    await supabase.from('sections').update({ sort_order: sectionA.sort_order }).eq('id', sectionB.id);
    await fetch();
  }, [sections, fetch]);

  return { sections, loading, error, refetch: fetch, updateSection, moveSection };
}
