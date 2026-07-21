package com.n3v.ticket.services;

import com.n3v.ticket.dto.notification.NotificationResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationWebSocketService {

    private static final String NOTIFICATION_DESTINATION =
            "/queue/notifications";

    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Gửi notification sau khi transaction database commit thành công.
     *
     * Nếu hiện tại không có transaction, gửi ngay.
     */
    public void sendToUser(
            String recipientEmail,
            NotificationResponse notification
    ) {
        if (recipientEmail == null
                || recipientEmail.isBlank()
                || notification == null) {
            return;
        }

        if (TransactionSynchronizationManager
                .isActualTransactionActive()) {

            TransactionSynchronizationManager
                    .registerSynchronization(
                            new TransactionSynchronization() {
                                @Override
                                public void afterCommit() {
                                    sendImmediately(
                                            recipientEmail,
                                            notification
                                    );
                                }
                            }
                    );

            return;
        }

        sendImmediately(recipientEmail, notification);
    }

    private void sendImmediately(
            String recipientEmail,
            NotificationResponse notification
    ) {
        messagingTemplate.convertAndSendToUser(
                recipientEmail,
                NOTIFICATION_DESTINATION,
                notification
        );

        log.info(
                "Đã gửi notification id={} đến {}",
                notification.getId(),
                recipientEmail
        );
    }
}