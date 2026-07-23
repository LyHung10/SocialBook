'use client';
import { useCallback } from 'react';
import { useSocket } from '@/context/SocketProvider';
import { ReadingRoomClientEvent } from '@/features/reading-rooms/types/reading-room.events';

export const useRoomAnnotations = () => {
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
