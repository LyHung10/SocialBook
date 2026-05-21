'use client';
import { useCallback } from 'react';
import { useReadingRoomStore } from '@/store/useReadingRoomStore';
import { useAppAuth } from '@/features/auth/hooks';
import { useSocket } from '@/context/SocketProvider';
import { ReadingRoomClientEvent, ReadingRoomServerEvent } from '@/features/reading-rooms/types/reading-room.events';
import type { RoomComment } from '../types/room-interaction.types';

export const useRoomAnnotations = (roomId?: string) => {
  const { user } = useAppAuth();
  const { getSocket } = useSocket();
  const socket = getSocket('/reading-rooms');

  const addComment = useCallback((
    roomId: string,
    chapterSlug: string,
    paragraphId: string,
    content: string,
    parentCommentId?: string,
  ) => {
    if (!socket?.connected) return;
    socket.emit(ReadingRoomClientEvent.ADD_COMMENT, {
      roomId,
      chapterSlug,
      paragraphId,
      content,
      parentCommentId,
    });
  }, [socket]);

  const deleteComment = useCallback((
    roomId: string,
    commentId: string,
    paragraphId: string,
  ) => {
    if (!socket?.connected) return;
    socket.emit(ReadingRoomClientEvent.DELETE_COMMENT, {
      roomId,
      commentId,
      paragraphId,
    });
  }, [socket]);

  return { addComment, deleteComment };
};

export const setupRoomAnnotationListeners = (socket: any, store: any) => {
  if (!socket) return;

  socket.on(ReadingRoomServerEvent.COMMENT_ADDED, (data: RoomComment) => {
    store.getState().addRoomComment(data);
  });

  socket.on(ReadingRoomServerEvent.COMMENT_DELETED, (data: { commentId: string; paragraphId: string }) => {
    store.getState().removeRoomComment(data.commentId, data.paragraphId);
  });
};
