'use client';
import { useCallback } from 'react';
import { useSocket } from '@/context/SocketProvider';
import { ReadingRoomClientEvent } from '@/features/reading-rooms/types/reading-room.events';
import type { ReactionType } from '../types/room-interaction.types';

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
    socket.emit(ReadingRoomClientEvent.ADD_REACTION, {
      roomId,
      chapterSlug,
      paragraphId,
      reactionType,
    });
  }, [socket]);

  return { addReaction };
};
