'use client';

import { motion } from 'framer-motion';
import { useAdmin } from '@/context/AdminContext';

type SectionWrapperProps = {
  id: string;
  sectionKey: string;
  children: React.ReactNode;
  className?: string;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onToggleVisible?: () => void;
  onEdit?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  visible?: boolean;
};

export function SectionWrapper({
  id,
  sectionKey,
  children,
  className = '',
  onMoveUp,
  onMoveDown,
  onToggleVisible,
  onEdit,
  canMoveUp = true,
  canMoveDown = true,
  visible = true,
}: SectionWrapperProps) {
  const { isAdmin } = useAdmin();

  if (!visible && !isAdmin) return null;

  return (
    <motion.section
      id={id}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={`relative ${!visible && isAdmin ? 'border-2 border-dashed border-violet/50 rounded-2xl p-4 bg-black/20' : ''} ${className}`}
    >
      {isAdmin && (
        <div className="absolute -top-2 right-2 z-20 flex items-center gap-1 rounded bg-violet/90 px-2 py-1 text-xs">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={!canMoveUp}
            className="rounded p-1 hover:bg-white/20 disabled:opacity-30"
            title="Monter"
            aria-label="Monter"
          >
            ↑
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={!canMoveDown}
            className="rounded p-1 hover:bg-white/20 disabled:opacity-30"
            title="Descendre"
            aria-label="Descendre"
          >
            ↓
          </button>
          <button
            type="button"
            onClick={onToggleVisible}
            className="rounded p-1 hover:bg-white/20"
            title={visible ? 'Masquer' : 'Afficher'}
            aria-label={visible ? 'Masquer' : 'Afficher'}
          >
            {visible ? '👁' : '👁‍🗨'}
          </button>
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="rounded p-1 hover:bg-white/20"
              title="Modifier"
              aria-label="Modifier"
            >
              ✎
            </button>
          )}
        </div>
      )}
      <div className={visible || !isAdmin ? '' : 'opacity-60'}>
        {children}
        {!visible && isAdmin && (
          <div className="mt-4 rounded-lg border border-violet/50 bg-violet/10 p-3 text-center text-sm text-white/70">
            📌 Section masquée pour les visiteurs
          </div>
        )}
      </div>
    </motion.section>
  );
}
