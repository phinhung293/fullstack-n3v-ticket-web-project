package com.n3v.ticket.dto.notification;

import com.n3v.ticket.enums.NotificationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateNotificationRequest {

    /**
     * ID tài khoản nhận thông báo.
     */
    private Long userId;

    /**
     * Loại thông báo.
     */
    private NotificationType type;

    /**
     * Tiêu đề ngắn.
     */
    private String title;

    /**
     * Nội dung chi tiết.
     */
    private String message;

    /**
     * Đường dẫn frontend khi nhấn vào thông báo.
     */
    private String targetUrl;

    /**
     * Loại đối tượng liên quan:
     * ORDER, TICKET, EVENT, DAILY_REPORT...
     */
    private String referenceType;

    /**
     * ID đối tượng liên quan.
     */
    private Long referenceId;

    /**
     * Khóa chống tạo thông báo trùng.
     */
    private String deduplicationKey;
}