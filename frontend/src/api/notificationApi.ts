import axiosInstance from './axiosInstance';
import type {
    ApiResponse,
    MarkAllNotificationsReadResult,
    NotificationItem,
    PageResponse,
    UnreadNotificationCount,
} from '../types/notification';

export const getNotifications = async (
    page = 0,
    size = 20,
): Promise<PageResponse<NotificationItem>> => {
    const response = await axiosInstance.get<
        ApiResponse<PageResponse<NotificationItem>>
    >('/notifications', {
        params: {
            page,
            size,
        },
    });

    return response.data.data;
};

export const getLatestNotifications = async (): Promise<
    NotificationItem[]
> => {
    const response = await axiosInstance.get<
        ApiResponse<NotificationItem[]>
    >('/notifications/latest');

    return response.data.data;
};

export const getUnreadNotificationCount =
    async (): Promise<number> => {
        const response = await axiosInstance.get<
            ApiResponse<UnreadNotificationCount>
        >('/notifications/unread-count');

        return response.data.data.unreadCount;
    };

export const markNotificationAsRead = async (
    notificationId: number,
): Promise<NotificationItem> => {
    const response = await axiosInstance.patch<
        ApiResponse<NotificationItem>
    >(`/notifications/${notificationId}/read`);

    return response.data.data;
};

export const markAllNotificationsAsRead =
    async (): Promise<MarkAllNotificationsReadResult> => {
        const response = await axiosInstance.patch<
            ApiResponse<MarkAllNotificationsReadResult>
        >('/notifications/read-all');

        return response.data.data;
    };

export const deleteNotification = async (
    notificationId: number,
): Promise<void> => {
    await axiosInstance.delete(
        `/notifications/${notificationId}`,
    );
};