package com.n3v.ticket.dto.notification;

import com.n3v.ticket.entities.Notification;
import com.n3v.ticket.enums.NotificationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationResponse {

    private Long id;

    private NotificationType type;

    private String title;

    private String message;

    private String targetUrl;

    private String referenceType;

    private Long referenceId;

    private boolean read;

    private OffsetDateTime readAt;

    private OffsetDateTime createdAt;

    /**
     * Chuyển Notification Entity thành DTO.
     *
     * Không trả về toàn bộ User Entity để tránh:
     * - lộ dữ liệu tài khoản
     * - vòng lặp JSON
     * - LazyInitializationException
     */
    public static NotificationResponse fromEntity(
            Notification notification
    ) {
        return NotificationResponse.builder()
                .id(notification.getId())
                .type(notification.getType())
                .title(notification.getTitle())
                .message(notification.getMessage())
                .targetUrl(notification.getTargetUrl())
                .referenceType(notification.getReferenceType())
                .referenceId(notification.getReferenceId())
                .read(notification.isRead())
                .readAt(notification.getReadAt())
                .createdAt(notification.getCreatedAt())
                .build();
    }
}