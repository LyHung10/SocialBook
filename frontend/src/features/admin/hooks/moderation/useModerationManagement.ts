import { useState } from 'react';
import { useGetFlaggedPostsQuery, useApprovePostMutation, useRejectPostMutation } from '@/features/admin/api/moderationApi';
import { useBanUserMutation } from '@/features/users/api/usersApi';
import { useModalStore } from '@/store/useModalStore';
import { getErrorMessage } from '@/lib/utils';
import { toast } from 'sonner';

function getModerationErrorMessage(error: unknown, fallback: string) {
    return error instanceof Error ? error.message : fallback;
}

export function useModerationManagement() {
    const [page, setPage] = useState(1);
    const limit = 10;

    const { data, isLoading, isFetching, refetch } = useGetFlaggedPostsQuery({ page, limit });
    const { openConfirm } = useModalStore();
    const [approvePost, { isLoading: isApproving }] = useApprovePostMutation();
    const [rejectPost, { isLoading: isRejecting }] = useRejectPostMutation();
    const [banUser, { isLoading: isBanning }] = useBanUserMutation();

    const posts = data?.data || [];
    const meta = data?.meta;

    const handleApprove = async (postId: string) => {
        try {
            await approvePost(postId).unwrap();
            toast.success('Bài viết đã được phê duyệt');
            refetch();
        } catch (error: unknown) {
            toast.error(getModerationErrorMessage(error, 'Phê duyệt thất bại'));
        }
    };

    const handleReject = async (postId: string) => {
        try {
            await rejectPost(postId).unwrap();
            toast.success('Bài viết đã bị từ chối và xóa');
            refetch();
        } catch (error: unknown) {
            toast.error(getModerationErrorMessage(error, 'Từ chối thất bại'));
        }
    };

    const handleBanUser = async (userId: string) => {
        try {
            await banUser(userId).unwrap();
            toast.success('Cập nhật trạng thái người dùng thành công');
        } catch (error: unknown) {
            toast.error(getErrorMessage(error));
        }
    };

    return {
        page,
        setPage,
        limit,
        posts,
        meta,
        isLoading,
        isFetching,
        isApproving,
        isRejecting,
        isBanning,
        handleApprove,
        handleReject,
        handleBanUser,
        openConfirm
    };
}
