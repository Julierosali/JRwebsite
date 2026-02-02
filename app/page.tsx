'use client';

import { useState, useMemo } from 'react';
import { useSections } from '@/hooks/useSections';
import { useAdmin } from '@/context/AdminContext';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';
import { AlbumSection } from '@/components/sections/AlbumSection';
import { PresentationSection } from '@/components/sections/PresentationSection';
import { PlayerSection } from '@/components/sections/PlayerSection';
import { ClipsSection } from '@/components/sections/ClipsSection';
import { SceneSection } from '@/components/sections/SceneSection';
import { PortraitSection } from '@/components/sections/PortraitSection';
import { ContactSection } from '@/components/sections/ContactSection';
import { EditSectionModal } from '@/components/EditSectionModal';
import { Section } from '@/lib/supabase';

const SECTION_KEYS_IN_MENU = ['album', 'presentation', 'player', 'scene', 'portrait', 'contact'];

export default function HomePage() {
  const { sections, loading, updateSection, moveSection } = useSections();
  const { isAdmin } = useAdmin();
  const [editingSection, setEditingSection] = useState<Section | null>(null);

  const sectionsByKey = useMemo(() => {
    const map: Record<string, Section> = {};
    sections.forEach((s) => {
      map[s.key] = s;
    });
    return map;
  }, [sections]);

  const handleSaveSection = async (id: string, content: Record<string, unknown>) => {
    await updateSection(id, { content });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-violet border-t-transparent" />
      </div>
    );
  }

  const headerSection = sectionsByKey['header'];
  const footerSection = sectionsByKey['footer'];
  const socialSection = sectionsByKey['social'];
  const streamingSection = sectionsByKey['streaming'];

  const visibleMenuKeys = sections
    .filter((s) => SECTION_KEYS_IN_MENU.includes(s.key) && s.visible !== false)
    .map((s) => s.key);

  return (
    <>
      {headerSection?.visible !== false && (
        <Header content={(headerSection?.content ?? {}) as { title?: string; subtitle?: string; logoUrl?: string }} />
      )}
      <Nav visibleSectionKeys={visibleMenuKeys} />
      {isAdmin && (
        <div className="sticky top-12 z-40 flex flex-wrap justify-center gap-2 border-b border-white/20 bg-black/40 py-2">
          <Link
            href="/admin"
            className="rounded bg-violet px-4 py-2 text-sm font-medium transition hover:bg-violet-light"
          >
            Admin
          </Link>
          {headerSection && (
            <button
              type="button"
              onClick={() => setEditingSection(headerSection)}
              className="rounded bg-white/20 px-3 py-2 text-sm hover:bg-white/30"
            >
              En-tête
            </button>
          )}
          {footerSection && (
            <button
              type="button"
              onClick={() => setEditingSection(footerSection)}
              className="rounded bg-white/20 px-3 py-2 text-sm hover:bg-white/30"
            >
              Pied de page
            </button>
          )}
          {socialSection && (
            <button
              type="button"
              onClick={() => setEditingSection(socialSection)}
              className="rounded bg-white/20 px-3 py-2 text-sm hover:bg-white/30"
            >
              Réseaux
            </button>
          )}
          {streamingSection && (
            <button
              type="button"
              onClick={() => setEditingSection(streamingSection)}
              className="rounded bg-white/20 px-3 py-2 text-sm hover:bg-white/30"
            >
              Streaming
            </button>
          )}
        </div>
      )}

      {sections
        .filter((s) => !['header', 'footer', 'social', 'streaming'].includes(s.key))
        .map((section, index, arr) => {
          const canMoveUp = index > 0;
          const canMoveDown = index < arr.length - 1;
          const moveUp = () => moveSection(index, 'up');
          const moveDown = () => moveSection(index, 'down');
          const toggleVisible = () => updateSection(section.id, { visible: !section.visible });
          const startEdit = () => setEditingSection(section);

          if (section.key === 'album') {
            return (
              <AlbumSection
                key={section.id}
                content={(section.content ?? {}) as Parameters<typeof AlbumSection>[0]['content']}
                sectionId={section.id}
                visible={section.visible}
                onMoveUp={moveUp}
                onMoveDown={moveDown}
                onToggleVisible={toggleVisible}
                onEdit={startEdit}
                canMoveUp={canMoveUp}
                canMoveDown={canMoveDown}
              />
            );
          }
          if (section.key === 'presentation') {
            return (
              <PresentationSection
                key={section.id}
                content={(section.content ?? {}) as Parameters<typeof PresentationSection>[0]['content']}
                visible={section.visible}
                onMoveUp={moveUp}
                onMoveDown={moveDown}
                onToggleVisible={toggleVisible}
                onEdit={startEdit}
                canMoveUp={canMoveUp}
                canMoveDown={canMoveDown}
              />
            );
          }
          if (section.key === 'player') {
            return (
              <PlayerSection
                key={section.id}
                content={(section.content ?? {}) as Parameters<typeof PlayerSection>[0]['content']}
                visible={section.visible}
                onMoveUp={moveUp}
                onMoveDown={moveDown}
                onToggleVisible={toggleVisible}
                onEdit={startEdit}
                canMoveUp={canMoveUp}
                canMoveDown={canMoveDown}
              />
            );
          }
          if (section.key === 'clips') {
            return (
              <ClipsSection
                key={section.id}
                content={(section.content ?? {}) as Parameters<typeof ClipsSection>[0]['content']}
                visible={section.visible}
                onMoveUp={moveUp}
                onMoveDown={moveDown}
                onToggleVisible={toggleVisible}
                onEdit={startEdit}
                canMoveUp={canMoveUp}
                canMoveDown={canMoveDown}
              />
            );
          }
          if (section.key === 'scene') {
            return (
              <SceneSection
                key={section.id}
                content={(section.content ?? {}) as Parameters<typeof SceneSection>[0]['content']}
                visible={section.visible}
                onMoveUp={moveUp}
                onMoveDown={moveDown}
                onToggleVisible={toggleVisible}
                onEdit={startEdit}
                canMoveUp={canMoveUp}
                canMoveDown={canMoveDown}
              />
            );
          }
          if (section.key === 'portrait') {
            return (
              <PortraitSection
                key={section.id}
                content={(section.content ?? {}) as Parameters<typeof PortraitSection>[0]['content']}
                visible={section.visible}
                onMoveUp={moveUp}
                onMoveDown={moveDown}
                onToggleVisible={toggleVisible}
                onEdit={startEdit}
                canMoveUp={canMoveUp}
                canMoveDown={canMoveDown}
              />
            );
          }
          if (section.key === 'contact') {
            return (
              <ContactSection
                key={section.id}
                content={(section.content ?? {}) as Parameters<typeof ContactSection>[0]['content']}
                socialContent={(socialSection?.content ?? {}) as { links?: { platform: string; url: string }[] }}
                streamingContent={(streamingSection?.content ?? {}) as { links?: { platform: string; url: string }[] }}
                visible={section.visible}
                onMoveUp={moveUp}
                onMoveDown={moveDown}
                onToggleVisible={toggleVisible}
                onEdit={startEdit}
                canMoveUp={canMoveUp}
                canMoveDown={canMoveDown}
              />
            );
          }
          return null;
        })}

      {footerSection?.visible !== false && (
        <Footer text={(footerSection?.content as { text?: string })?.text} />
      )}

      {editingSection && (
        <EditSectionModal
          section={editingSection}
          onClose={() => setEditingSection(null)}
          onSave={handleSaveSection}
        />
      )}
    </>
  );
}
