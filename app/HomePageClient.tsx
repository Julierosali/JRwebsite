'use client';

import dynamic from 'next/dynamic';
import { useState, useMemo } from 'react';
import { useSections } from '@/hooks/useSections';
import { useAdmin } from '@/context/AdminContext';
import { useLocale } from '@/context/LocaleContext';
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
import { StyleInjector } from '@/components/StyleInjector';

const EditSectionModal = dynamic(() => import('@/components/EditSectionModal').then((m) => m.EditSectionModal), { ssr: false });
const EditStyleModal = dynamic(() => import('@/components/EditStyleModal').then((m) => m.EditStyleModal), { ssr: false });
const EditSeoModal = dynamic(() => import('@/components/EditSeoModal').then((m) => m.EditSeoModal), { ssr: false });
const AnalyticsDashboard = dynamic(() => import('@/components/AnalyticsDashboard').then((m) => m.AnalyticsDashboard), { ssr: false });
import { Section } from '@/lib/supabase';
import { clampFontSize } from '@/lib/fontSize';
import { getSectionContent } from '@/lib/locale';

const SECTION_KEYS_IN_MENU = ['album', 'presentation', 'player', 'scene', 'portrait', 'contact'];

export default function HomePageClient() {
  const { sections, loading, updateSection, moveSection } = useSections();
  const { isAdmin } = useAdmin();
  const { locale } = useLocale();
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [editingStyleSection, setEditingStyleSection] = useState<Section | null>(null);
  const [showSeoModal, setShowSeoModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);

  const sectionsByKey = useMemo(() => {
    const map: Record<string, Section> = {};
    sections.forEach((s) => {
      map[s.key] = s;
    });
    return map;
  }, [sections]);

  const sectionTitles = useMemo(() => {
    const out: Record<string, string> = {};
    for (const s of sections) {
      if (!SECTION_KEYS_IN_MENU.includes(s.key)) continue;
      const c = getSectionContent(s.content as Record<string, unknown>, locale) as { title?: string };
      if (c?.title?.trim()) out[s.key] = c.title.trim();
    }
    return out;
  }, [sections, locale]);

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
  const styleSection = sectionsByKey['style'];

  const visibleMenuKeys = sections
    .filter((s) => SECTION_KEYS_IN_MENU.includes(s.key) && s.visible !== false)
    .map((s) => s.key);

  const headerContentResolved = getSectionContent(headerSection?.content as Record<string, unknown>, locale);
  const headerContentWithSize = {
    ...headerContentResolved,
    titleFontSize: clampFontSize(headerContentResolved?.titleFontSize ?? (headerSection?.content as Record<string, unknown>)?.titleFontSize),
    textFontSize: clampFontSize(headerContentResolved?.textFontSize ?? (headerSection?.content as Record<string, unknown>)?.textFontSize),
  };

  const styleContentResolved = (styleSection?.content ?? undefined) as import('@/lib/style').StyleContent | undefined;
  const styleContent = styleContentResolved && typeof styleContentResolved === 'object' && !('fr' in styleContentResolved)
    ? styleContentResolved
    : (styleSection?.content as Record<string, unknown>)?.[locale] ?? styleContentResolved;

  return (
    <>
      <StyleInjector styleContent={styleContent as import('@/lib/style').StyleContent | undefined} />
      {headerSection?.visible !== false && (
        <Header content={headerContentWithSize as import('@/components/Header').HeaderContent} />
      )}
      <Nav visibleSectionKeys={visibleMenuKeys} sectionTitles={sectionTitles} />
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
          {styleSection && (
            <button
              type="button"
              onClick={() => setEditingStyleSection(styleSection)}
              className="rounded bg-white/20 px-3 py-2 text-sm hover:bg-white/30"
            >
              Style
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowSeoModal(true)}
            className="rounded bg-white/20 px-3 py-2 text-sm hover:bg-white/30"
          >
            SEO
          </button>
          <button
            type="button"
            onClick={() => setShowStatsModal(true)}
            className="rounded bg-white/20 px-3 py-2 text-sm hover:bg-white/30"
          >
            Statistiques
          </button>
        </div>
      )}

      {showStatsModal && <AnalyticsDashboard onClose={() => setShowStatsModal(false)} />}

      {sections
        .filter((s) => !['header', 'footer', 'social', 'streaming', 'style'].includes(s.key))
        .map((section, index, arr) => {
          const canMoveUp = index > 0;
          const canMoveDown = index < arr.length - 1;
          const moveUp = () => moveSection(index, 'up');
          const moveDown = () => moveSection(index, 'down');
          const toggleVisible = () => updateSection(section.id, { visible: !section.visible });
          const startEdit = () => setEditingSection(section);
          const rawContent = (section.content ?? {}) as Record<string, unknown>;
          const contentResolved = getSectionContent(rawContent, locale) as Record<string, unknown>;

          if (section.key === 'album') {
            return (
              <AlbumSection
                key={section.id}
                content={contentResolved as Parameters<typeof AlbumSection>[0]['content']}
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
                content={contentResolved as Parameters<typeof PresentationSection>[0]['content']}
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
                content={contentResolved as Parameters<typeof PlayerSection>[0]['content']}
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
                content={contentResolved as Parameters<typeof ClipsSection>[0]['content']}
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
                content={contentResolved as Parameters<typeof SceneSection>[0]['content']}
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
                content={contentResolved as Parameters<typeof PortraitSection>[0]['content']}
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
            const socialResolved = getSectionContent(socialSection?.content as Record<string, unknown>, locale) as { links?: { platform: string; url: string }[] };
            const streamingResolved = getSectionContent(streamingSection?.content as Record<string, unknown>, locale) as { links?: { platform: string; url: string }[] };
            return (
              <ContactSection
                key={section.id}
                content={contentResolved as Parameters<typeof ContactSection>[0]['content']}
                socialContent={socialResolved}
                streamingContent={streamingResolved}
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

      {footerSection?.visible !== false && (() => {
        const footerResolved = getSectionContent(footerSection?.content as Record<string, unknown>, locale) as { text?: string; textFontSize?: number };
        return (
          <Footer
            text={footerResolved?.text}
            textFontSize={clampFontSize(footerResolved?.textFontSize)}
          />
        );
      })()}

      {editingSection && (
        <EditSectionModal
          section={editingSection}
          onClose={() => setEditingSection(null)}
          onSave={handleSaveSection}
        />
      )}
      {editingStyleSection && (
        <EditStyleModal
          section={editingStyleSection}
          onClose={() => setEditingStyleSection(null)}
          onSave={handleSaveSection}
        />
      )}
      {showSeoModal && (
        <EditSeoModal onClose={() => setShowSeoModal(false)} />
      )}
    </>
  );
}
