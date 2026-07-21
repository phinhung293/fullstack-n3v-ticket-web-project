package com.n3v.ticket.repositories;

import com.n3v.ticket.entities.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface NotificationRepository
        extends JpaRepository<Notification, Long> {

    /**
     * Lấy danh sách thông báo của user theo thứ tự mới nhất.
     *
     * Pageable sẽ quyết định:
     * - page hiện tại
     * - số phần tử mỗi trang
     * - cách sắp xếp
     */
    Page<Notification> findByUserId(
            Long userId,
            Pageable pageable
    );

    /**
     * Lấy một thông báo theo ID và user sở hữu.
     *
     * Điều kiện userId giúp ngăn user đọc hoặc sửa thông báo
     * của tài khoản khác.
     */
    Optional<Notification> findByIdAndUserId(
            Long notificationId,
            Long userId
    );

    /**
     * Đếm số thông báo chưa đọc của user.
     */
    long countByUserIdAndReadFalse(Long userId);

    /**
     * Kiểm tra khóa chống thông báo trùng.
     */
    boolean existsByDeduplicationKey(String deduplicationKey);

    /**
     * Tìm thông báo theo khóa chống trùng.
     */
    Optional<Notification> findByDeduplicationKey(
            String deduplicationKey
    );

    /**
     * Lấy một số thông báo mới nhất của user.
     *
     * Có thể dùng sau này cho dropdown chuông thông báo.
     */
    List<Notification> findTop10ByUserIdOrderByCreatedAtDesc(
            Long userId
    );

    /**
     * Đánh dấu tất cả thông báo của user là đã đọc.
     *
     * Chỉ cập nhật các thông báo đang chưa đọc.
     */
    @Modifying
    @Query("""
            UPDATE Notification notification
            SET notification.read = true,
                notification.readAt = :readAt
            WHERE notification.user.id = :userId
              AND notification.read = false
            """)
    int markAllAsRead(
            @Param("userId") Long userId,
            @Param("readAt") OffsetDateTime readAt
    );

    /**
     * Xóa các thông báo cũ đã đọc.
     *
     * Chức năng này chưa sử dụng ngay trong Bước 2,
     * nhưng có thể dùng cho scheduler dọn dữ liệu sau này.
     */
    long deleteByReadTrueAndCreatedAtBefore(
            OffsetDateTime createdAt
    );
}