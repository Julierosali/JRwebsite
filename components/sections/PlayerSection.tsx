'use client';

import { motion } from 'framer-motion';
import { getSpotifyEmbedUrl } from '@/lib/spotify';
import { SectionWrapper } from '@/components/SectionWrapper';

type PlayerContent = {
  title?: string;
  spotifyEmbedUrl?: string;
  spotifyPlaylistId?: string;
};

export function PlayerSection({
  content,
  visible,
  onMoveUp,
  onMoveDown,
  onToggleVisible,
  onEdit,
  canMoveUp,
  canMoveDown,
}: {
  content: PlayerContent;
  visible: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onToggleVisible: () => void;
  onEdit?: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  const c = content ?? {};
  const embedUrl = (c.spotifyEmbedUrl ?? (c as { spotify_embed_url?: string }).spotify_embed_url ?? '') as string;
  const playlistId = (c.spotifyPlaylistId ?? (c as { spotify_playlist_id?: string }).spotify_playlist_id ?? '') as string;
  const src = getSpotifyEmbedUrl(String(embedUrl || playlistId).trim());

  return (
    <SectionWrapper
      id="player"
      sectionKey="player"
      onMoveUp={onMoveUp}
      onMoveDown={onMoveDown}
      onToggleVisible={onToggleVisible}
      onEdit={onEdit}
      canMoveUp={canMoveUp}
      canMoveDown={canMoveDown}
      visible={visible}
    >
      <div className="mx-auto max-w-4xl px-4 pt-12 pb-4 md:pt-16 md:pb-6">
        <h2 className="font-title mb-6 text-center text-3xl font-bold tracking-wide md:text-4xl">
          {content?.title ?? 'Écouter'}
        </h2>
        {src ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="overflow-hidden rounded-xl bg-black/40 p-4 shadow-xl"
          >
            <iframe
              title="Spotify"
              src={src}
              width="100%"
              height="352"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              className="rounded-lg"
            />
          </motion.div>
        ) : (
          <div className="rounded-xl bg-black/40 p-8 text-center shadow-xl">
            <p className="text-white/80 font-medium">Aucun lecteur configuré</p>
            <p className="mt-2 text-sm text-white/60">
              Configurez un lien ou un ID de playlist Spotify dans l&apos;admin (bouton &laquo;&nbsp;Écouter&nbsp;&raquo; ou crayon sur cette section).
            </p>
          </div>
        )}
      </div>
    </SectionWrapper>
  );
}
