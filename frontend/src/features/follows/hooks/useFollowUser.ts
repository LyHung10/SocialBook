'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { MESSAGES } from '@/constants/messages';
import { useToggleFollowMutation, useUnfollowMutation } from '@/features/follows/api/followApi';

interface UseFollowUserOptions {
    userId: string;
    initialIsFollowing?: boolean;
    onFollowChange?: (isFollowing: boolean) => void;
}

export function useFollowUser({ userId, initialIsFollowing = false, onFollowChange }: UseFollowUserOptions) {
    const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
    const [toggleFollow, { isLoading: isFollowLoading }] = useToggleFollowMutation();
    const [unfollow, { isLoading: isUnfollowLoading }] = useUnfollowMutation();
    const isLoading = isFollowLoading || isUnfollowLoading;

    const handleToggle = useCallback(async () => {
        try {
            if (isFollowing) {
                await unfollow(userId).unwrap();
            } else {
                await toggleFollow(userId).unwrap();
            }
            const newState = !isFollowing;
            setIsFollowing(newState);
            onFollowChange?.(newState);
        } catch (e) {
            toast.error(MESSAGES.FOLLOW_TOGGLE_FAILED);
        }
    }, [isFollowing, userId, toggleFollow, unfollow, onFollowChange]);

    return {
        isFollowing,
        isLoading,
        toggleFollow: handleToggle,
    };
}
