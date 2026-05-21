import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '@/lib/nestjs-client-api';
import type { ReactionType, RoomComment, RoomReactionEvent, RoomQuote } from '../types/room-interaction.types';

interface AddReactionParams {
  roomId: string;
  chapterSlug: string;
  paragraphId: string;
  reactionType: ReactionType;
}

export const roomInteractionsApi = createApi({
  reducerPath: 'roomInteractionsApi',
  baseQuery: axiosBaseQuery(),
  endpoints: (builder) => ({
    addReaction: builder.mutation<RoomReactionEvent, AddReactionParams>({
      query: (body) => ({
        url: `/reading-rooms/${body.roomId}/reactions`,
        method: 'POST',
        body,
      }),
    }),
    getRoomQuotes: builder.query<RoomQuote[], { code: string }>({
      query: ({ code }) => ({
        url: `/reading-rooms/${code}/quotes`,
        method: 'GET',
      }),
    }),
    getRoomComments: builder.query<RoomComment[], { code: string; chapterSlug?: string }>({
      query: ({ code, chapterSlug }) => ({
        url: `/reading-rooms/${code}/comments`,
        method: 'GET',
        params: { chapterSlug },
      }),
    }),
    getRoomReactions: builder.query<RoomReactionEvent[], { code: string; chapterSlug?: string }>({
      query: ({ code, chapterSlug }) => ({
        url: `/reading-rooms/${code}/reactions`,
        method: 'GET',
        params: { chapterSlug },
      }),
    }),
  }),
});

export const { useAddReactionMutation, useGetRoomQuotesQuery, useLazyGetRoomCommentsQuery, useLazyGetRoomReactionsQuery } = roomInteractionsApi;
