'use client';
import { memo, useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useReadingRoomStore } from '@/store/useReadingRoomStore';
import { useShallow } from 'zustand/react/shallow';
import { useAppAuth } from '@/features/auth/hooks';
import { useRoomReactions } from '../hooks/useRoomReactions';
import { REACTION_META, ReactionType } from '../types/room-interaction.types';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface ParagraphReactionsProps {
  roomId: string;
  chapterSlug: string;
  paragraphId: string;
}

export const ParagraphReactions = memo(function ParagraphReactions({ roomId, chapterSlug, paragraphId }: ParagraphReactionsProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [pickerPos, setPickerPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const { user } = useAppAuth();
  const reactions = useReadingRoomStore(useShallow((s) => s.reactions[paragraphId]));
  const { addReaction } = useRoomReactions();

  // Close picker when clicking outside
  useEffect(() => {
    if (!showPicker) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        pickerRef.current && !pickerRef.current.contains(e.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(e.target as Node)
      ) {
        setShowPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showPicker]);

  if (!roomId) return null;

  const activeEmoji = (Object.entries(REACTION_META) as [ReactionType, typeof REACTION_META[ReactionType]][]).filter(
    ([type]) => (reactions?.[type]?.length || 0) > 0,
  );

  const handleReact = (type: ReactionType) => {
    addReaction(roomId!, chapterSlug, paragraphId, type);
    setShowPicker(false);
  };

  const handleTogglePicker = () => {
    if (!showPicker && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPickerPos({
        top: rect.top + window.scrollY - 8,
        left: rect.left + window.scrollX,
      });
    }
    setShowPicker((v) => !v);
  };

  return (
    <span className="relative inline-flex items-center gap-0.5">
      {activeEmoji.map(([type, meta]) => {
        const count = reactions?.[type]?.length || 0;
        const hasReacted = reactions?.[type]?.includes(user?.id || '') || false;
        return (
          <button
            key={type}
            onClick={() => handleReact(type)}
            className={cn(
              'inline-flex items-center gap-0.5 transition-all hover:scale-110 cursor-pointer leading-none',
              hasReacted ? 'opacity-100' : 'hover:opacity-100',
            )}
            title={meta.label}
          >
            <span className="text-xs leading-none">{meta.emoji}</span>
            <span className="text-[10px] font-medium tabular-nums text-foreground">{count}</span>
          </button>
        );
      })}

      <button
        ref={triggerRef}
        onClick={handleTogglePicker}
        className="inline-flex items-center justify-center transition-colors cursor-pointer leading-none text-muted-foreground hover:text-foreground"
      >
        <span className="text-xs leading-none font-medium">+</span>
      </button>

      {typeof window !== 'undefined' && createPortal(
        <AnimatePresence>
          {showPicker && (
            <motion.div
              ref={pickerRef}
              initial={{ opacity: 0, scale: 0.9, y: 4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 4 }}
              style={{
                position: 'absolute',
                top: pickerPos.top,
                left: pickerPos.left,
                transform: 'translateY(-100%)',
                zIndex: 9999,
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-popover border border-border shadow-xl"
            >
              {(Object.entries(REACTION_META) as [ReactionType, typeof REACTION_META[ReactionType]][]).map(([type]) => {
                const hasReacted = reactions?.[type]?.includes(user?.id || '') || false;
                return (
                  <button
                    key={type}
                    onClick={() => handleReact(type)}
                    className={cn(
                      'px-1 py-0.5 rounded-full text-base transition-all hover:scale-125 cursor-pointer',
                      hasReacted && 'bg-primary/15 scale-110',
                    )}
                  >
                    {REACTION_META[type].emoji}
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </span>
  );
});
