package com.n3v.ticket.entities;

import com.n3v.ticket.enums.NotificationType;
import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;

@Entity
@Table(name = "notifications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Người nhận thông báo.
     *
     * Cả user và admin đều nằm trong bảng users,
     * vì vậy mỗi thông báo sẽ gắn với một user cụ thể.
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /**
     * Loại thông báo.
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private NotificationType type;

    /**
     * Tiêu đề ngắn của thông báo.
     */
    @Column(nullable = false, length = 255)
    private String title;

    /**
     * Nội dung chi tiết.
     */
    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    /**
     * Đường dẫn frontend khi người dùng nhấn vào thông báo.
     */
    @Column(name = "target_url", length = 500)
    private String targetUrl;

    /**
     * Loại dữ liệu liên quan.
     */
    @Column(name = "reference_type", length = 50)
    private String referenceType;

    /**
     * ID của đối tượng liên quan.
     */
    @Column(name = "reference_id")
    private Long referenceId;

    /**
     * Khóa chống tạo thông báo trùng.
     */
    @Column(
            name = "deduplication_key",
            unique = true,
            length = 255
    )
    private String deduplicationKey;

    /**
     * Trạng thái đã đọc.
     */
    @Column(name = "is_read", nullable = false)
    @Builder.Default
    private boolean read = false;

    /**
     * Thời điểm người dùng đọc thông báo.
     */
    @Column(name = "read_at")
    private OffsetDateTime readAt;

    /**
     * Thời điểm tạo thông báo.
     */
    @Column(
            name = "created_at",
            nullable = false,
            updatable = false
    )
    private OffsetDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = OffsetDateTime.now();
        }
    }

    /**
     * Đánh dấu thông báo đã đọc.
     */
    public void markAsRead() {
        if (!read) {
            read = true;
            readAt = OffsetDateTime.now();
        }
    }
}