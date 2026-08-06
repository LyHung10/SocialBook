import { create } from 'zustand';
import type { ReactNode } from 'react';
import { Post } from '@/features/posts/types/post.interface';
import { BookForAdmin } from '@/features/books/types/book.interface';
import { Chapter } from '@/features/chapters/types/chapter.interface';

export type ModalName =
  | 'createPost'
  | 'editPost'
  | 'sharePost'
  | 'postComment'
  | 'addToLibrary'
  | 'followers'
  | 'chapterSummary'
  | 'fileImport'
  | 'deleteBook'
  | 'createCollection'
  | 'editCollection'
  | 'confirm'
  | 'genre'
  | 'author'
  | 'manageChapter';

export interface CreatePostModalData {
  defaultContent?: string;
  defaultBookId?: string;
  defaultBookTitle?: string;
  title?: string;
  contentLabel?: string;
  contentPlaceholder?: string;
  maxImages?: number;
  onSubmit?: (data: { content: string; images: File[]; bookId: string }) => Promise<void>;
}

export interface EditPostModalData {
  post: Post;
}

export interface SharePostModalData {
  postUrl: string;
  shareTitle: string;
  shareMedia: string;
}

export interface PostCommentModalData {
  post: Post;
  handleLike: (postId: string) => void;
  commentCount?: number;
  likeStatus?: boolean;
  likeCount?: number;
}

export interface AddToLibraryModalData {
  bookId: string;
}

export interface ChapterSummaryModalData {
  chapterId: string;
  chapterTitle: string;
}

export interface FileImportModalData {
  bookSlug: string;
  currentChapterCount: number;
  onImport: (chapters: { title: string; content: string }[]) => void;
}

export interface CreateCollectionModalData {
  onSuccess?: () => void;
}

export interface EditCollectionModalData {
  collectionId: string;
  currentName: string;
  currentIsPublic: boolean;
  onSuccess?: () => void;
}

export interface DeleteBookModalData {
  book: BookForAdmin;
  isDeleting: boolean;
  onConfirm: () => void;
}

export interface ConfirmModalData {
  title: string;
  description: string | ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void | Promise<void>;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
}

export interface GenreModalData {
  genre?: {
    id: string;
    name: string;
    description?: string;
  };
  onSuccess?: () => void;
}

export interface AuthorModalData {
  author?: {
    id: string;
    name: string;
    bio?: string;
    photoUrl?: string;
  };
  onSuccess?: () => void;
}

export interface ManageChapterModalData {
  bookSlug: string;
  bookId: string;
  chapter?: Chapter; // Optional for edit mode
  onSuccess?: () => void;
}

export type ModalDataType =
  | Record<string, unknown>
  | CreatePostModalData
  | EditPostModalData
  | SharePostModalData
  | PostCommentModalData
  | AddToLibraryModalData
  | ChapterSummaryModalData
  | FileImportModalData
  | CreateCollectionModalData
  | EditCollectionModalData
  | DeleteBookModalData
  | ConfirmModalData
  | GenreModalData
  | AuthorModalData
  | ManageChapterModalData
  | null;

export interface ModalState<T = ModalDataType> {
  isOpen: boolean;
  data: T;
}

export interface TypedModals {
  createPost: ModalState<CreatePostModalData>;
  editPost: ModalState<EditPostModalData | null>;
  sharePost: ModalState<SharePostModalData | null>;
  postComment: ModalState<PostCommentModalData | null>;
  addToLibrary: ModalState<AddToLibraryModalData | null>;
  followers: ModalState<{ userId: string; count?: number } | null>;
  chapterSummary: ModalState<ChapterSummaryModalData | null>;
  fileImport: ModalState<FileImportModalData | null>;
  deleteBook: ModalState<DeleteBookModalData | null>;
  createCollection: ModalState<CreateCollectionModalData | null>;
  editCollection: ModalState<EditCollectionModalData | null>;
  confirm: ModalState<ConfirmModalData | null>;
  genre: ModalState<GenreModalData | null>;
  author: ModalState<AuthorModalData | null>;
  manageChapter: ModalState<ManageChapterModalData | null>;
}

export interface ModalStore {
  modals: TypedModals;
  openModal: (name: ModalName, data?: ModalDataType) => void;
  closeModal: (name: ModalName) => void;

  openCreatePost: (data?: CreatePostModalData) => void;
  closeCreatePost: () => void;

  openEditPost: (data: EditPostModalData) => void;
  closeEditPost: () => void;

  openSharePost: (data: SharePostModalData) => void;
  closeSharePost: () => void;

  openPostComment: (data: PostCommentModalData) => void;
  closePostComment: () => void;

  openAddToLibrary: (data: AddToLibraryModalData) => void;
  closeAddToLibrary: () => void;

  openFollowers: (data: { userId: string; count?: number }) => void;
  closeFollowers: () => void;

  openChapterSummary: (data: ChapterSummaryModalData) => void;
  closeChapterSummary: () => void;

  openFileImport: (data: FileImportModalData) => void;
  closeFileImport: () => void;

  openDeleteBook: (data: DeleteBookModalData) => void;
  closeDeleteBook: () => void;

  openCreateCollection: (data?: CreateCollectionModalData) => void;
  closeCreateCollection: () => void;

  openEditCollection: (data: EditCollectionModalData) => void;
  closeEditCollection: () => void;

  openConfirm: (data: ConfirmModalData) => void;
  closeConfirm: () => void;

  openGenreModal: (data?: GenreModalData) => void;
  closeGenreModal: () => void;

  openAuthorModal: (data?: AuthorModalData) => void;
  closeAuthorModal: () => void;

  openManageChapter: (data: ManageChapterModalData) => void;
  closeManageChapter: () => void;
}

const initialModalsState: TypedModals = {
  createPost: { isOpen: false, data: {} },
  editPost: { isOpen: false, data: null },
  sharePost: { isOpen: false, data: null },
  postComment: { isOpen: false, data: null },
  addToLibrary: { isOpen: false, data: null },
  followers: { isOpen: false, data: null },
  chapterSummary: { isOpen: false, data: null },
  fileImport: { isOpen: false, data: null },
  deleteBook: { isOpen: false, data: null },
  createCollection: { isOpen: false, data: null },
  editCollection: { isOpen: false, data: null },
  confirm: { isOpen: false, data: null },
  genre: { isOpen: false, data: null },
  author: { isOpen: false, data: null },
  manageChapter: { isOpen: false, data: null },
};

export const useModalStore = create<ModalStore>((set, get) => ({
  modals: initialModalsState,

  openModal: (name, data) =>
    set((state) => ({
      modals: {
        ...state.modals,
        [name]: { isOpen: true, data: data ?? (name === 'createPost' ? {} : null) },
      } as TypedModals,
    })),

  closeModal: (name) =>
    set((state) => ({
      modals: {
        ...state.modals,
        [name]: { isOpen: false, data: name === 'createPost' ? {} : null },
      } as TypedModals,
    })),

  openCreatePost: (data) => get().openModal('createPost', data),
  closeCreatePost: () => get().closeModal('createPost'),

  openEditPost: (data) => get().openModal('editPost', data),
  closeEditPost: () => get().closeModal('editPost'),

  openSharePost: (data) => get().openModal('sharePost', data),
  closeSharePost: () => get().closeModal('sharePost'),

  openPostComment: (data) => get().openModal('postComment', data),
  closePostComment: () => get().closeModal('postComment'),

  openAddToLibrary: (data) => get().openModal('addToLibrary', data),
  closeAddToLibrary: () => get().closeModal('addToLibrary'),

  openFollowers: (data) => get().openModal('followers', data),
  closeFollowers: () => get().closeModal('followers'),

  openChapterSummary: (data) => get().openModal('chapterSummary', data),
  closeChapterSummary: () => get().closeModal('chapterSummary'),

  openFileImport: (data) => get().openModal('fileImport', data),
  closeFileImport: () => get().closeModal('fileImport'),

  openDeleteBook: (data) => get().openModal('deleteBook', data),
  closeDeleteBook: () => get().closeModal('deleteBook'),

  openCreateCollection: (data) => get().openModal('createCollection', data),
  closeCreateCollection: () => get().closeModal('createCollection'),

  openEditCollection: (data) => get().openModal('editCollection', data),
  closeEditCollection: () => get().closeModal('editCollection'),

  openConfirm: (data) => get().openModal('confirm', data),
  closeConfirm: () => get().closeModal('confirm'),

  openGenreModal: (data) => get().openModal('genre', data),
  closeGenreModal: () => get().closeModal('genre'),

  openAuthorModal: (data) => get().openModal('author', data),
  closeAuthorModal: () => get().closeModal('author'),

  openManageChapter: (data) => get().openModal('manageChapter', data),
  closeManageChapter: () => get().closeModal('manageChapter'),
}));
