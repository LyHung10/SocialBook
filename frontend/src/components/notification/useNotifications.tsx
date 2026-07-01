"use client";

import { useState, useCallback } from 'react';
import { useNotificationSocket, NotificationItem } from '@/features/notifications/hooks/useNotificationSocket';

export type { NotificationItem };

export function useNotifications(userToken: string | undefined) {
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const handleNotificationList = useCallback((data: NotificationItem[]) => {
        setNotifications(data);
    }, []);

    const handleNewNotification = useCallback((payload: NotificationItem) => {
        setNotifications((prev) => [payload, ...prev]);
    }, []);

    const handleReadNotification = useCallback(({ id }: { id: string }) => {
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
    }, []);

    const { markAsRead, refetch, createNotification } = useNotificationSocket(
        userToken,
        {
            onNotificationList: handleNotificationList,
            onNewNotification: handleNewNotification,
            onReadNotification: handleReadNotification,
        }
    );

    const markAsReadLocal = useCallback((id: string) => {
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
        markAsRead(id);
    }, [markAsRead]);

    return {
        notifications,
        unreadCount,
        markAsRead: markAsReadLocal,
        refetch,
        createNotification,
    };
}
