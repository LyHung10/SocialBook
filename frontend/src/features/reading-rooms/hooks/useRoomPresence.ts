import { useEffect } from 'react';
import { useReadingRoomStore } from '@/store/useReadingRoomStore';

export const useRoomPresence = (
  chapterSlug: string,
  sendHeartbeat: (slug: string, paraId?: string, progress?: number) => void,
  activeParagraphId?: string | null,
  readingProgress?: number,
) => {
  const room = useReadingRoomStore((state) => state.room);

  useEffect(() => {
    if (!room) return;

    const interval = setInterval(() => {
      sendHeartbeat(chapterSlug, activeParagraphId || undefined, readingProgress);
    }, 10_000);

    // Send immediate heartbeat on change
    sendHeartbeat(chapterSlug, activeParagraphId || undefined, readingProgress);

    return () => clearInterval(interval);
  }, [room, chapterSlug, activeParagraphId, sendHeartbeat, readingProgress]);
};
