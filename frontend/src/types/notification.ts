export type NotificationType =
    | 'PAYMENT_SUCCESS'
    | 'TICKET_CHECKED_IN'
    | 'TICKET_EXPIRED'
    | 'EVENT_REMINDER'
    | 'EVENT_CANCELLED'
    | 'EVENT_RESCHEDULED'
    | 'ADMIN_NEW_PAID_ORDER'
    | 'ADMIN_DAILY_SUMMARY';

export type NotificationItem = {
    id: number;
    type: NotificationType;
    title: string;
    message: string;
    targetUrl: string | null;
    referenceType: string | null;
    referenceId: number | null;
    read: boolean;
    readAt: string | null;
    createdAt: string;
};

export type UnreadNotificationCount = {
    unreadCount: number;
};

export type MarkAllNotificationsReadResult = {
    updatedCount: number;
};

export type ApiResponse<T> = {
    code: number;
    success: boolean;
    message: string;
    data: T;
    timestamp: string;
};

export type PageResponse<T> = {
    content: T[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
    first: boolean;
    last: boolean;
    empty: boolean;
};
