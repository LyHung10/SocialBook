import { useEffect, useRef, useCallback } from 'react';
import { useReadingRoomStore } from '@/store/useReadingRoomStore';

export const useRoomPresence = (
  chapterSlug: string,
  sendHeartbeat: (slug: string, paraId?: string, progress?: number, bookId?: string, chapterId?: string) => void,
  activeParagraphId?: string | null,
  readingProgress?: number,
  bookId?: string,
  chapterId?: string,
) => {
  const room = useReadingRoomStore((state) => state.room);

  // 1. Dùng ref để lưu giá trị mới nhất, tránh tạo lại hàm emit liên tục
  const readingProgressRef = useRef(readingProgress);
  const activeParagraphIdRef = useRef(activeParagraphId);

  useEffect(() => {
    readingProgressRef.current = readingProgress;
  }, [readingProgress]);

  useEffect(() => {
    activeParagraphIdRef.current = activeParagraphId;
  }, [activeParagraphId]);

  const lastSentAt = useRef<number>(0);
  const pendingTimeout = useRef<NodeJS.Timeout | null>(null);
  const THROTTLE_MS = 2100;

  const emit = useCallback(() => {
    if (!room) return;
    sendHeartbeat(chapterSlug, activeParagraphIdRef.current || undefined, readingProgressRef.current, bookId, chapterId);
    lastSentAt.current = Date.now();
    if (pendingTimeout.current) {
      clearTimeout(pendingTimeout.current);
      pendingTimeout.current = null;
    }
  }, [room, chapterSlug, sendHeartbeat, bookId, chapterId]);

  useEffect(() => {
    if (!room) return;

    const timeSinceLast = Date.now() - lastSentAt.current;

    if (timeSinceLast >= THROTTLE_MS) {
      emit();
    } else {
      if (pendingTimeout.current) clearTimeout(pendingTimeout.current);
      pendingTimeout.current = setTimeout(emit, THROTTLE_MS - timeSinceLast);
    }
  }, [room, activeParagraphId, readingProgress, emit]);

  useEffect(() => {
    if (!room) return;

    const interval = setInterval(() => {
      if (Date.now() - lastSentAt.current >= 9000) {
        emit();
      }
    }, 10_000);

    return () => {
      clearInterval(interval);
      if (pendingTimeout.current) clearTimeout(pendingTimeout.current);
    };
  }, [room, emit]);
};
