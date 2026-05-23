import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/utils';
import {
    useDeleteCommentMutation,
    useEditCommentMutation,
    usePostCreateMutation,
} from '@/features/comments/api/commentApi';
import { CommentItem } from '@/features/comments/types/comment.interface';
import { usePostToggleLikeMutation } from '@/features/likes/api/likeApi';
import { useOptimisticToggle } from '@/hooks/useOptimisticToggle';
import { MESSAGES } from '@/constants/messages';

export interface UseCommentActionsOptions {
    comment: CommentItem;
    targetId: string;
    targetType: string;
    userId?: string;
}

export interface UseCommentActionsResult {
    isOwner: boolean;
    optimisticLikeCount: number;
    optimisticIsLiked: boolean;
    optimisticReplyCount: number;
    isEditing: boolean;
    editText: string;
    isReplying: boolean;
    replyText: string;
    showReplies: boolean;
    isEditingComment: boolean;
    isDeletingComment: boolean;
    isPostingReply: boolean;
    effectiveParentId: string;
    setIsEditing: (v: boolean) => void;
    setEditText: (v: string) => void;
    setIsReplying: (v: boolean) => void;
    setReplyText: (v: string) => void;
    setShowReplies: (v: boolean) => void;
    handleEditComment: () => Promise<void>;
    handleDeleteComment: () => Promise<void>;
    handleSubmitReply: () => Promise<void>;
    handleLikeComment: () => Promise<void>;
    handleReplyClick: () => void;
}

export function useCommentActions({
    comment,
    targetId,
    targetType,
    userId,
}: UseCommentActionsOptions): UseCommentActionsResult {
    const [showReplies, setShowReplies] = useState(false);
    const [isReplying, setIsReplying] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(comment.content);
    const [optimisticReplyCount, setOptimisticReplyCount] = useState(
        comment.repliesCount ?? 0
    );

    const isOwner = comment.user.id === userId;
    const hasReplyCount = comment.repliesCount !== undefined;

    const [editComment, { isLoading: isEditingComment }] =
        useEditCommentMutation();
    const [deleteComment, { isLoading: isDeletingComment }] =
        useDeleteCommentMutation();
    const [postToggleLike] = usePostToggleLikeMutation();
    const [createComment, { isLoading: isPostingReply }] =
        usePostCreateMutation();

    const {
        count: optimisticLikeCount,
        isActive: optimisticIsLiked,
        toggle: handleLikeComment,
    } = useOptimisticToggle({
        initialCount: comment.likesCount ?? 0,
        initialState: comment.isLiked ?? false,
        onToggle: () => postToggleLike({
            targetId: comment.id,
            targetType: 'comment',
        }).unwrap(),
    });

    useEffect(() => {
        if (hasReplyCount) {
            setOptimisticReplyCount(comment.repliesCount ?? 0);
        }
    }, [comment.repliesCount, hasReplyCount]);

    const handleReplyClick = useCallback(() => {
        setShowReplies(true);
        setIsReplying((prev) => !prev);
    }, []);

    const handleEditComment = useCallback(async () => {
        const content = editText.trim();
        if (!content || content === comment.content) {
            setIsEditing(false);
            return;
        }

        try {
            await editComment({
                id: comment.id,
                content,
                targetId,
                parentId: comment.parentId ?? null,
            }).unwrap();
            toast.success(MESSAGES.COMMENT_UPDATE_SUCCESS);
            setIsEditing(false);
        } catch (error: unknown) {
            const apiError = error as {
                status?: number;
                data?: { message?: string };
            };

            if (apiError?.status === 400 && apiError?.data?.message) {
                toast.error(`Sửa thất bại: ${apiError.data.message}`);
            } else if (apiError?.status !== 401) {
                toast.error(getErrorMessage(error));
            }
        }
    }, [editText, comment, targetId, editComment]);

    const handleDeleteComment = useCallback(async () => {
        try {
            await deleteComment({
                id: comment.id,
                targetId,
                parentId: comment.parentId ?? null,
            }).unwrap();
            toast.success(MESSAGES.COMMENT_DELETE_SUCCESS);
        } catch (error: unknown) {
            if ((error as { status?: number })?.status !== 401) {
                toast.error(getErrorMessage(error));
            }
        }
    }, [comment.id, comment.parentId, targetId, deleteComment]);

    const handleSubmitReply = useCallback(async () => {
        const content = replyText.trim();
        if (!content) return;

        try {
            await createComment({
                targetType,
                targetId,
                content,
                parentId: comment.parentId ?? comment.id,
            }).unwrap();

            setReplyText('');
            setShowReplies(true);
            setIsReplying(false);

            if (hasReplyCount) {
                setOptimisticReplyCount((prev) => prev + 1);
            }
        } catch (error: unknown) {
            toast.error(getErrorMessage(error));
        }
    }, [replyText, targetType, targetId, comment.id, hasReplyCount, createComment]);



    const effectiveParentId = comment.parentId ?? comment.id;

    return {
        isOwner,
        optimisticLikeCount,
        optimisticIsLiked,
        optimisticReplyCount,
        isEditing,
        editText,
        isReplying,
        replyText,
        showReplies,
        isEditingComment,
        isDeletingComment,
        isPostingReply,
        effectiveParentId,
        setIsEditing,
        setEditText,
        setIsReplying,
        setReplyText,
        setShowReplies,
        handleEditComment,
        handleDeleteComment,
        handleSubmitReply,
        handleLikeComment,
        handleReplyClick,
    };
}
