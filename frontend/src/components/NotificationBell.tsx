import {
    Bell,
    CalendarClock,
    Check,
    CheckCheck,
    CircleDollarSign,
    ClipboardCheck,
    ShoppingCart,
    TicketCheck,
    X,
} from 'lucide-react';
import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from 'react';
import { useNavigate } from 'react-router-dom';

import {
    getLatestNotifications,
    getUnreadNotificationCount,
    markAllNotificationsAsRead,
    markNotificationAsRead,
} from '../api/notificationApi';

import {
    connectNotificationSocket,
    disconnectNotificationSocket,
} from '../api/notificationSocket';

import type {
    NotificationItem,
    NotificationType,
} from '../types/notification';

type NotificationBellProps = {
    variant?: 'user' | 'admin';
};

const getNotificationIcon = (
    type: NotificationType,
) => {
    switch (type) {
        case 'PAYMENT_SUCCESS':
            return CircleDollarSign;

        case 'ADMIN_NEW_PAID_ORDER':
            return ShoppingCart;

        case 'TICKET_CHECKED_IN':
            return TicketCheck;

        case 'EVENT_REMINDER':
            return CalendarClock;

        case 'EVENT_CANCELLED':
        case 'EVENT_RESCHEDULED':
            return ClipboardCheck;

        case 'ADMIN_DAILY_SUMMARY':
            return CheckCheck;

        default:
            return Bell;
    }
};

const formatNotificationTime = (
    createdAt: string,
): string => {
    const date = new Date(createdAt);

    if (Number.isNaN(date.getTime())) {
        return '';
    }

    const difference =
        Date.now() - date.getTime();

    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;

    if (difference < minute) {
        return 'Vừa xong';
    }

    if (difference < hour) {
        return `${Math.floor(difference / minute)} phút trước`;
    }

    if (difference < day) {
        return `${Math.floor(difference / hour)} giờ trước`;
    }

    return date.toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
};

function NotificationBell({
                              variant = 'user',
                          }: NotificationBellProps) {
    const navigate = useNavigate();

    const dropdownRef =
        useRef<HTMLDivElement | null>(null);

    const [isOpen, setIsOpen] =
        useState(false);

    const [notifications, setNotifications] =
        useState<NotificationItem[]>([]);

    const [unreadCount, setUnreadCount] =
        useState(0);

    const [loading, setLoading] =
        useState(false);

    const [markingAll, setMarkingAll] =
        useState(false);

    const loadNotifications =
        useCallback(async () => {
            setLoading(true);

            try {
                const [
                    latestNotifications,
                    currentUnreadCount,
                ] = await Promise.all([
                    getLatestNotifications(),
                    getUnreadNotificationCount(),
                ]);

                setNotifications(
                    latestNotifications,
                );

                setUnreadCount(
                    currentUnreadCount,
                );
            } catch (error) {
                console.error(
                    'Không thể tải thông báo',
                    error,
                );
            } finally {
                setLoading(false);
            }
        }, []);

    useEffect(() => {
        void loadNotifications();

        connectNotificationSocket(
            (newNotification) => {
                setNotifications((current) => {
                    const alreadyExists =
                        current.some(
                            (item) =>
                                item.id ===
                                newNotification.id,
                        );

                    if (alreadyExists) {
                        return current;
                    }

                    return [
                        newNotification,
                        ...current,
                    ].slice(0, 10);
                });

                if (!newNotification.read) {
                    setUnreadCount(
                        (current) => current + 1,
                    );
                }
            },
        );

        return () => {
            void disconnectNotificationSocket();
        };
    }, [loadNotifications]);

    useEffect(() => {
        const handleOutsideClick = (
            event: MouseEvent,
        ) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(
                    event.target as Node,
                )
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener(
            'mousedown',
            handleOutsideClick,
        );

        return () => {
            document.removeEventListener(
                'mousedown',
                handleOutsideClick,
            );
        };
    }, []);

    const handleToggle = () => {
        setIsOpen((current) => !current);
    };

    const handleNotificationClick = async (
        notification: NotificationItem,
    ) => {
        let updatedNotification =
            notification;

        if (!notification.read) {
            try {
                updatedNotification =
                    await markNotificationAsRead(
                        notification.id,
                    );

                setNotifications((current) =>
                    current.map((item) =>
                        item.id ===
                        updatedNotification.id
                            ? updatedNotification
                            : item,
                    ),
                );

                setUnreadCount((current) =>
                    Math.max(current - 1, 0),
                );
            } catch (error) {
                console.error(
                    'Không thể đánh dấu thông báo đã đọc',
                    error,
                );
            }
        }

        setIsOpen(false);

        if (updatedNotification.targetUrl) {
            navigate(
                updatedNotification.targetUrl,
            );
        }
    };

    const handleMarkAllAsRead =
        async () => {
            if (
                markingAll ||
                unreadCount === 0
            ) {
                return;
            }

            setMarkingAll(true);

            try {
                await markAllNotificationsAsRead();

                const readAt =
                    new Date().toISOString();

                setNotifications((current) =>
                    current.map((notification) => ({
                        ...notification,
                        read: true,
                        readAt:
                            notification.readAt ??
                            readAt,
                    })),
                );

                setUnreadCount(0);
            } catch (error) {
                console.error(
                    'Không thể đánh dấu tất cả thông báo đã đọc',
                    error,
                );
            } finally {
                setMarkingAll(false);
            }
        };

    const isAdmin =
        variant === 'admin';

    const badgeText =
        unreadCount > 99
            ? '99+'
            : String(unreadCount);

    return (
        <div
            ref={dropdownRef}
            className="relative"
        >
            <button
                type="button"
                onClick={handleToggle}
                className={
                    isAdmin
                        ? 'relative flex h-10 w-10 items-center justify-center rounded-xl text-white transition hover:bg-white/10 hover:text-[#F43F73]'
                        : 'relative flex h-8 w-8 items-center justify-center text-white transition hover:text-[#F43F73]'
                }
                aria-label="Mở thông báo"
                aria-expanded={isOpen}
            >
                <Bell
                    size={isAdmin ? 22 : 17}
                    strokeWidth={2.2}
                />

                {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#F43F73] px-1 text-[10px] font-black leading-none text-white">
                        {badgeText}
                    </span>
                )}
            </button>

            {isOpen && (
                <div
                    className={
                        isAdmin
                            ? 'fixed left-3 right-3 top-[70px] z-[100] max-h-[520px] overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white text-[#0B1736] shadow-[0_22px_60px_rgba(15,23,42,0.28)] sm:absolute sm:left-auto sm:right-0 sm:top-[48px] sm:w-[390px]'
                            : 'fixed left-3 right-3 top-[70px] z-[100] max-h-[520px] overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white text-[#0B1736] shadow-[0_22px_60px_rgba(15,23,42,0.28)] sm:absolute sm:left-auto sm:right-0 sm:top-[44px] sm:w-[390px]'
                    }
                >
                    <div className="flex items-center justify-between border-b border-[#E2E8F0] px-4 py-3">
                        <div>
                            <h3 className="text-base font-black">
                                Thông báo
                            </h3>

                            <p className="mt-0.5 text-xs font-semibold text-[#64748B]">
                                {unreadCount > 0
                                    ? `${unreadCount} thông báo chưa đọc`
                                    : 'Bạn đã đọc tất cả thông báo'}
                            </p>
                        </div>

                        <div className="flex items-center gap-1">
                            {unreadCount > 0 && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        void handleMarkAllAsRead()
                                    }
                                    disabled={markingAll}
                                    className="rounded-lg px-2 py-1 text-xs font-bold text-[#F43F73] transition hover:bg-[#FFF1F5] disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {markingAll
                                        ? 'Đang xử lý...'
                                        : 'Đọc tất cả'}
                                </button>
                            )}

                            <button
                                type="button"
                                onClick={() =>
                                    setIsOpen(false)
                                }
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#64748B] transition hover:bg-[#F1F5F9] hover:text-[#0B1736]"
                                aria-label="Đóng thông báo"
                            >
                                <X size={17} />
                            </button>
                        </div>
                    </div>

                    <div className="max-h-[430px] overflow-y-auto">
                        {loading ? (
                            <div className="space-y-3 p-4">
                                {[1, 2, 3].map(
                                    (item) => (
                                        <div
                                            key={item}
                                            className="h-[76px] animate-pulse rounded-xl bg-[#F1F5F9]"
                                        />
                                    ),
                                )}
                            </div>
                        ) : notifications.length ===
                        0 ? (
                            <div className="flex min-h-[220px] flex-col items-center justify-center px-6 text-center">
                                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#FFF1F5] text-[#F43F73]">
                                    <Bell size={25} />
                                </div>

                                <h4 className="mt-4 text-sm font-black text-[#0B1736]">
                                    Chưa có thông báo
                                </h4>

                                <p className="mt-1 text-xs font-semibold text-[#94A3B8]">
                                    Thông báo mới sẽ xuất hiện tại đây.
                                </p>
                            </div>
                        ) : (
                            notifications.map(
                                (notification) => {
                                    const Icon =
                                        getNotificationIcon(
                                            notification.type,
                                        );

                                    return (
                                        <button
                                            key={
                                                notification.id
                                            }
                                            type="button"
                                            onClick={() =>
                                                void handleNotificationClick(
                                                    notification,
                                                )
                                            }
                                            className={`relative flex w-full gap-3 border-b border-[#F1F5F9] px-4 py-3 text-left transition last:border-b-0 hover:bg-[#F8FAFC] ${
                                                notification.read
                                                    ? 'bg-white'
                                                    : 'bg-[#FFF7FA]'
                                            }`}
                                        >
                                            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FFF1F5] text-[#F43F73]">
                                                <Icon
                                                    size={19}
                                                    strokeWidth={
                                                        2.2
                                                    }
                                                />
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-start justify-between gap-3">
                                                    <p className="line-clamp-1 text-sm font-black text-[#0B1736]">
                                                        {
                                                            notification.title
                                                        }
                                                    </p>

                                                    {!notification.read && (
                                                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#F43F73]" />
                                                    )}
                                                </div>

                                                <p className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-[#64748B]">
                                                    {
                                                        notification.message
                                                    }
                                                </p>

                                                <div className="mt-1.5 flex items-center gap-1 text-[11px] font-bold text-[#94A3B8]">
                                                    {notification.read && (
                                                        <Check
                                                            size={
                                                                12
                                                            }
                                                        />
                                                    )}

                                                    {formatNotificationTime(
                                                        notification.createdAt,
                                                    )}
                                                </div>
                                            </div>
                                        </button>
                                    );
                                },
                            )
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default NotificationBell;