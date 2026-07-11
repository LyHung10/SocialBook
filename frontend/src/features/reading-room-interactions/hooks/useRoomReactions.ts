'use client';
import { useCallback } from 'react';
import { useSocket } from '@/context/SocketProvider';
import { ReadingRoomClientEvent } from '@/features/reading-rooms/types/reading-room.events';
import type { ReactionType } from '../types/room-interaction.types';
import { useReadingRoomStore } from '@/store/useReadingRoomStore';

export const useRoomReactions = () => {
  const { getSocket } = useSocket();
  const socket = getSocket('/reading-rooms');

  const addReaction = useCallback((
    roomId: string,
    chapterSlug: string,
    paragraphId: string,
    reactionType: ReactionType,
  ) => {
    if (!socket?.connected) return;

    // Get the preview of the text that was reacted to from the DOM or store
    const store = useReadingRoomStore.getState();
    const content = store.paragraphContentMap[paragraphId] || '';
    const paragraphPreview = content.length > 40 ? content.slice(0, 40) + '...' : content;

    socket.emit(ReadingRoomClientEvent.ADD_REACTION, {
      roomId,
      chapterSlug,
      paragraphId,
      reactionType,
      paragraphPreview,
    });
  }, [socket]);

  return { addReaction };
};
