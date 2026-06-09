'use client';
import { useState, useRef, useEffect } from 'react';
import { useReadingRoomStore } from '@/store/useReadingRoomStore';
import { useShallow } from 'zustand/react/shallow';
import { useRoomAnnotations } from '../hooks/useRoomAnnotations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageCircle, MessageSquare, Send } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface ParagraphAnnotationsProps {
  roomId: string;
  chapterSlug: string;
  paragraphId: string;
  isOpen?: boolean;
  onToggle?: (open: boolean) => void;
}

export function ParagraphAnnotations({ roomId, chapterSlug, paragraphId, isOpen: controlledOpen, onToggle }: ParagraphAnnotationsProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setIsOpen = (value: boolean) => {
    setInternalOpen(value);
    onToggle?.(value);
  };
  const [text, setText] = useState('');
  const comments = useReadingRoomStore(useShallow((s) => s.roomComments.filter(
    c => c.paragraphId === paragraphId && !c.parentCommentId,
  )));
  const commentCount = useReadingRoomStore((s) => s.annotations[paragraphId] || 0);
  const { addComment } = useRoomAnnotations();
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [comments.length, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    addComment(roomId!, chapterSlug, paragraphId, text.trim());
    setText('');
  };

  return (
    <div className="w-full min-w-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-0.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer leading-none"
      >
        <MessageCircle size={14} className="text-xs leading-none translate-y-[0.5px]" />
        {commentCount > 0 && (
          <span className="text-[10px] font-medium tabular-nums text-foreground">
            {commentCount}
          </span>
        )}
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="inline-comments"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="mt-2 p-3 border rounded-lg bg-muted/30 w-full min-w-0">
              <div ref={listRef} className="max-h-48 overflow-y-auto overflow-x-hidden space-y-2">
                {comments.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-4 text-muted-foreground">
                    <MessageSquare className="mb-1.5 h-4 w-4 text-muted-foreground" />
                    <p className="text-xs text-center">
                      Chưa có bình luận nào cho đoạn này
                    </p>
                  </div>
                )}
                {comments.map((c) => (
                  <div key={c.id} className="text-xs p-2 rounded-lg bg-muted/50">
                    <span className="font-bold text-xs text-muted-foreground">{c.displayName || c.userId.slice(0, 6)}</span>
                    <p className="mt-0.5 break-all whitespace-pre-wrap max-w-full">{c.content}</p>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="flex items-center gap-2 mt-3">
                <Input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Viết bình luận..."
                  className="h-8 text-xs rounded-lg"
                />
                <Button type="submit" size="icon" className="h-8 w-8 shrink-0 rounded-lg" disabled={!text.trim()}>
                  <Send size={12} />
                </Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
