import { isAnyOf, Middleware } from '@reduxjs/toolkit';
import { userLoggedOut } from './actions';
import { authApi } from '@/features/auth/api/authApi';
import { postApi } from '@/features/posts/api/postApi';
import { booksApi } from '@/features/books/api/bookApi';
import { chaptersApi } from '@/features/chapters/api/chaptersApi';
import { bookRelationApi } from '@/features/admin/api/bookRelationApi';
import { followApi } from '@/features/follows/api/followApi';
import { reviewApi } from '@/features/reviews/api/reviewApi';
import { libraryApi } from '@/features/library/api/libraryApi';
import { userHighlightsApi } from '@/features/user-highlights/api/userHighlightsApi';
import { bookmarkApi } from '@/features/bookmarks/api/bookmarkApi';
import { usersApi } from '@/features/users/api/usersApi';
import { ttsApi } from '@/features/tts/api/ttsApi';
import { authorApi } from '@/features/authors/api/authorApi';
import { genreApi } from '@/features/genres/api/genreApi';
import { analyticsApi } from '@/features/admin/api/analyticsApi';
import { likeApi } from '@/features/likes/api/likeApi';
import { geminiApi } from '@/features/gemini/api/geminiApi';
import { recommendationsApi } from '@/features/recommendations/api/recommendationsApi';
import { chatBotApi } from '@/features/chatbot/api/chatBotApi';
import { moderationApi } from '@/features/admin/api/moderationApi';
import { readingRoomsApi } from '@/features/reading-rooms/api/readingRoomsApi';
import { roomInteractionsApi } from '@/features/reading-room-interactions/api/roomInteractionsApi';
import { toxicWordsApi } from '@/features/admin/api/toxicWordsApi';
import { rateLimitApi } from '@/features/admin/api/rateLimitApi';
import { commentApi } from '@/features/comments/api/commentApi';

const allApis = [
  authApi,
  postApi,
  booksApi,
  chaptersApi,
  commentApi,
  bookRelationApi,
  followApi,
  reviewApi,
  libraryApi,
  userHighlightsApi,
  bookmarkApi,
  usersApi,
  ttsApi,
  authorApi,
  genreApi,
  analyticsApi,
  likeApi,
  geminiApi,
  recommendationsApi,
  chatBotApi,
  moderationApi,
  readingRoomsApi,
  roomInteractionsApi,
  toxicWordsApi,
  rateLimitApi,
];

export const apiResetMiddleware: Middleware = (storeApi) => (next) => (action) => {
  const result = next(action);

  if (isAnyOf(userLoggedOut)(action)) {
    allApis.forEach((api) => {
      storeApi.dispatch(api.util.resetApiState());
    });
  }

  return result;
};
