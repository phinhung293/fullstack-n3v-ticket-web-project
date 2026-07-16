package com.n3v.ticket.controllers;

import com.n3v.ticket.common.ApiResponse;
import com.n3v.ticket.common.exception.NotFoundException;
import com.n3v.ticket.dto.notification.MarkAllNotificationsReadResponse;
import com.n3v.ticket.dto.notification.NotificationResponse;
import com.n3v.ticket.dto.notification.UnreadNotificationCountResponse;
import com.n3v.ticket.entities.User;
import com.n3v.ticket.repositories.UserRepository;
import com.n3v.ticket.services.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final UserRepository userRepository;

    /**
     * Lấy danh sách thông báo có phân trang.
     *
     * Ví dụ:
     * GET /api/notifications?page=0&size=20
     */
    @GetMapping
    public ApiResponse<Page<NotificationResponse>> getNotifications(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        User currentUser = getCurrentUser(authentication);

        Page<NotificationResponse> notifications =
                notificationService.getNotifications(
                        currentUser.getId(),
                        page,
                        size
                );

        return ApiResponse.success(notifications);
    }

    /**
     * Lấy 10 thông báo mới nhất.
     *
     * Dùng cho dropdown chuông thông báo.
     */
    @GetMapping("/latest")
    public ApiResponse<List<NotificationResponse>>
    getLatestNotifications(
            Authentication authentication
    ) {
        User currentUser = getCurrentUser(authentication);

        List<NotificationResponse> notifications =
                notificationService.getLatestNotifications(
                        currentUser.getId()
                );

        return ApiResponse.success(notifications);
    }

    /**
     * Đếm số thông báo chưa đọc.
     */
    @GetMapping("/unread-count")
    public ApiResponse<UnreadNotificationCountResponse>
    getUnreadCount(
            Authentication authentication
    ) {
        User currentUser = getCurrentUser(authentication);

        long unreadCount =
                notificationService.countUnreadNotifications(
                        currentUser.getId()
                );

        return ApiResponse.success(
                new UnreadNotificationCountResponse(unreadCount)
        );
    }

    /**
     * Đánh dấu một thông báo là đã đọc.
     */
    @PatchMapping("/{notificationId}/read")
    public ApiResponse<NotificationResponse> markAsRead(
            Authentication authentication,
            @PathVariable Long notificationId
    ) {
        User currentUser = getCurrentUser(authentication);

        NotificationResponse notification =
                notificationService.markAsRead(
                        currentUser.getId(),
                        notificationId
                );

        return ApiResponse.success(
                "Đã đánh dấu thông báo là đã đọc",
                notification
        );
    }

    /**
     * Đánh dấu tất cả thông báo là đã đọc.
     */
    @PatchMapping("/read-all")
    public ApiResponse<MarkAllNotificationsReadResponse>
    markAllAsRead(
            Authentication authentication
    ) {
        User currentUser = getCurrentUser(authentication);

        int updatedCount =
                notificationService.markAllAsRead(
                        currentUser.getId()
                );

        return ApiResponse.success(
                "Đã đánh dấu tất cả thông báo là đã đọc",
                new MarkAllNotificationsReadResponse(updatedCount)
        );
    }

    /**
     * Xóa một thông báo.
     */
    @DeleteMapping("/{notificationId}")
    public ApiResponse<Void> deleteNotification(
            Authentication authentication,
            @PathVariable Long notificationId
    ) {
        User currentUser = getCurrentUser(authentication);

        notificationService.deleteNotification(
                currentUser.getId(),
                notificationId
        );

        return ApiResponse.successMessage(
                "Xóa thông báo thành công"
        );
    }

    /**
     * Lấy tài khoản hiện tại từ email trong JWT.
     *
     * authentication.getName() chính là email được đặt
     * trong JwtAuthenticationFilter.
     */
    private User getCurrentUser(
            Authentication authentication
    ) {
        if (authentication == null
                || authentication.getName() == null) {
            throw new NotFoundException(
                    "Không tìm thấy thông tin đăng nhập"
            );
        }

        return userRepository
                .findByEmail(authentication.getName())
                .orElseThrow(() ->
                        new NotFoundException(
                                "Không tìm thấy người dùng"
                        )
                );
    }
}