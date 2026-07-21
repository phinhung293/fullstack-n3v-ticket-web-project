import { Client, type IMessage } from '@stomp/stompjs';
import type { NotificationItem } from '../types/notification';

let notificationClient: Client | null = null;

export const connectNotificationSocket = (
    onNotification: (
        notification: NotificationItem,
    ) => void,
): Client | null => {
    const token = localStorage.getItem('accessToken');

    if (!token) {
        return null;
    }

    if (notificationClient?.active) {
        return notificationClient;
    }

    notificationClient = new Client({
        brokerURL: 'ws://localhost:8080/ws',

        connectHeaders: {
            Authorization: `Bearer ${token}`,
        },

        reconnectDelay: 5000,
        heartbeatIncoming: 10000,
        heartbeatOutgoing: 10000,

        onConnect: () => {
            notificationClient?.subscribe(
                '/user/queue/notifications',
                (frame: IMessage) => {
                    try {
                        const notification = JSON.parse(
                            frame.body,
                        ) as NotificationItem;

                        onNotification(notification);
                    } catch (error) {
                        console.error(
                            'Không thể đọc thông báo WebSocket',
                            error,
                        );
                    }
                },
            );
        },

        onStompError: (frame) => {
            console.error(
                'Lỗi STOMP:',
                frame.headers.message,
                frame.body,
            );
        },

        onWebSocketError: (event) => {
            console.error(
                'Lỗi kết nối WebSocket:',
                event,
            );
        },

        onWebSocketClose: (event) => {
            if (event.code !== 1000) {
                console.warn(
                    'WebSocket đã đóng:',
                    event.code,
                    event.reason,
                );
            }
        },
    });

    notificationClient.activate();

    return notificationClient;
};

export const disconnectNotificationSocket =
    async (): Promise<void> => {
        if (!notificationClient) {
            return;
        }

        await notificationClient.deactivate();
        notificationClient = null;
    };