'use client';
import { useCallback } from 'react';
import { useSocket } from '@/context/SocketProvider';
import { ReadingRoomClientEvent, ReadingRoomServerEvent } from '@/features/reading-rooms/types/reading-room.events';
import type { ReactionType, RoomReactionEvent } from '../types/room-interaction.types';

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

export const setupRoomReactionListeners = (socket: any, store: any) => {
  if (!socket) return;

  socket.on(ReadingRoomServerEvent.REACTION_ADDED, (data: RoomReactionEvent) => {
    store.getState().updateReaction(
      data.paragraphId,
      data.reactionType,
      data.userId,
      data.displayName,
      true,
    );
  });
};
