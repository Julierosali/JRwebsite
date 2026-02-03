'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { SectionWrapper } from '@/components/SectionWrapper';
import { SocialIcons } from '@/components/SocialIcons';
import { StreamingIcons } from '@/components/StreamingIcons';
import { clampFontSize } from '@/lib/fontSize';

type ContactContent = {
  title?: string;
  body?: string;
  imageUrl?: string;
  email?: string;
  phone?: string;
  titleFontSize?: number;
  textFontSize?: number;
};

export function ContactSection({
  content,
  socialContent,
  streamingContent,
  visible,
  onMoveUp,
  onMoveDown,
  onToggleVisible,
  onEdit,
  canMoveUp,
  canMoveDown,
}: {
  content: ContactContent;
  socialContent?: { links?: { platform: string; url: string }[] };
  streamingContent?: { links?: { platform: string; url: string }[] };
  visible: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onToggleVisible: () => void;
  onEdit?: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  const email = content?.email ?? '';
  const phone = content?.phone ?? '';
  const imageUrl = content?.imageUrl ?? '';
  const titlePx = clampFontSize(content?.titleFontSize);
  const textPx = clampFontSize(content?.textFontSize);

  return (
    <SectionWrapper
      id="contact"
      sectionKey="contact"
      onMoveUp={onMoveUp}
      onMoveDown={onMoveDown}
      onToggleVisible={onToggleVisible}
      onEdit={onEdit}
      canMoveUp={canMoveUp}
      canMoveDown={canMoveDown}
      visible={visible}
    >
      <div className="mx-auto max-w-5xl px-4 py-12 md:py-16">
        <h2 className="font-title mb-8 text-center text-3xl font-bold tracking-wide md:text-4xl" style={titlePx != null ? { fontSize: `${titlePx}px` } : undefined}>
          {content?.title ?? 'Contact'}
        </h2>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="overflow-hidden rounded-xl bg-accent p-8 shadow-xl md:grid md:grid-cols-2 md:gap-8"
          data-block="contact"
        >
          <div>
            {content?.body ? <p className="mb-6 font-body text-white/95 whitespace-pre-line" style={textPx != null ? { fontSize: `${textPx}px` } : undefined}>{content.body}</p> : null}
            <div className="space-y-4">
              {email ? (
                <p>
                  <span className="mr-2">@</span>
                  <a href={`mailto:${email}`} className="underline hover:no-underline" data-analytics-id="Contact|Email">
                    {email}
                  </a>
                </p>
              ) : null}
              {phone ? (
                <p>
                  <span className="mr-2">📞</span>
                  <a href={`tel:${phone.replace(/\s/g, '')}`} className="underline hover:no-underline">
                    {phone}
                  </a>
                </p>
              ) : null}
            </div>
            <div className="mt-8">
              <SocialIcons links={socialContent?.links ?? []} />
            </div>
            <div className="mt-6">
              <StreamingIcons links={streamingContent?.links ?? []} />
            </div>
          </div>
          {imageUrl ? (
            <div className="relative mt-6 aspect-[4/5] md:mt-0">
              <Image
                src={imageUrl}
                alt="Contact Julie Rosali"
                fill
                className="rounded-lg object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          ) : (
            <div className="mt-6 flex aspect-[4/5] items-center justify-center rounded-lg bg-white/10 md:mt-0">
              <span className="text-white/40">Photo</span>
            </div>
          )}
        </motion.div>
      </div>
    </SectionWrapper>
  );
}
