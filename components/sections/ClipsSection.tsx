'use client';

import { motion } from 'framer-motion';
import { SectionWrapper } from '@/components/SectionWrapper';
import { parseVideoUrl } from '@/lib/video';

type VideoItem = { title?: string; youtubeId?: string };

type ClipsContent = {
  title?: string;
  videos?: VideoItem[];
};

function ClipCard({ video: v, index }: { video: VideoItem; index: number }) {
  const raw = v.youtubeId ?? '';
  const parsed = parseVideoUrl(raw);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className="overflow-hidden rounded-xl bg-black/40 shadow-xl"
    >
      {parsed ? (
        <div className="relative aspect-video">
          {parsed.kind === 'youtube' ? (
            <iframe
              title={v.title ?? `Clip ${index + 1}`}
              src={`https://www.youtube-nocookie.com/embed/${parsed.id}?rel=0`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 h-full w-full"
            />
          ) : (
            <iframe
              title={v.title ?? `Clip ${index + 1}`}
              src={`https://player.vimeo.com/video/${parsed.id}`}
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 h-full w-full"
            />
          )}
        </div>
      ) : (
        <div className="flex aspect-video items-center justify-center bg-white/10 text-white/50">
          Vidéo à venir
        </div>
      )}
      {v.title ? <p className="font-anton p-3 text-center font-medium">{v.title}</p> : null}
    </motion.div>
  );
}

export function ClipsSection({
  content,
  visible,
  onMoveUp,
  onMoveDown,
  onToggleVisible,
  onEdit,
  canMoveUp,
  canMoveDown,
}: {
  content: ClipsContent;
  visible: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onToggleVisible: () => void;
  onEdit?: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  const videos = content?.videos ?? [{ title: 'Clip 1', youtubeId: '' }, { title: 'Clip 2', youtubeId: '' }, { title: 'Clip 3', youtubeId: '' }];

  return (
    <SectionWrapper
      id="clips"
      sectionKey="clips"
      onMoveUp={onMoveUp}
      onMoveDown={onMoveDown}
      onToggleVisible={onToggleVisible}
      onEdit={onEdit}
      canMoveUp={canMoveUp}
      canMoveDown={canMoveDown}
      visible={visible}
    >
      <div className="mx-auto max-w-6xl px-4 pt-4 pb-12 md:pt-6 md:pb-16">
        <div className="grid gap-6 md:grid-cols-3">
          {videos.map((v, i) => (
            <ClipCard key={i} video={v} index={i} />
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
}
