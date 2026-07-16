package com.n3v.ticket.services;

import com.n3v.ticket.dto.notification.CreateNotificationRequest;
import com.n3v.ticket.dto.notification.NotificationResponse;
import com.n3v.ticket.entities.Notification;
import com.n3v.ticket.entities.User;
import com.n3v.ticket.repositories.NotificationRepository;
import com.n3v.ticket.repositories.UserRepository;
import com.n3v.ticket.common.exception.BadRequestException;
import com.n3v.ticket.common.exception.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private static final int MAX_PAGE_SIZE = 100;

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final NotificationWebSocketService notificationWebSocketService;

    /**
     * Tạo và lưu một thông báo mới.
     *
     * Nếu deduplicationKey đã tồn tại, hệ thống không tạo thêm
     * thông báo trùng mà trả về thông báo cũ.
     */
    @Transactional
    public NotificationResponse createNotification(
            CreateNotificationRequest request
    ) {
        validateCreateRequest(request);

        String deduplicationKey =
                normalizeNullableText(request.getDeduplicationKey());

        /*
         * Kiểm tra trước để tránh thực hiện truy vấn User
         * nếu thông báo đã tồn tại.
         */
        if (deduplicationKey != null) {
            Optional<Notification> existingNotification =
                    notificationRepository.findByDeduplicationKey(
                            deduplicationKey
                    );

            if (existingNotification.isPresent()) {
                return NotificationResponse.fromEntity(
                        existingNotification.get()
                );
            }
        }

        User recipient = userRepository.findById(request.getUserId())
                .orElseThrow(() ->
                        new NotFoundException(
                                "Không tìm thấy tài khoản nhận thông báo"
                        )
                );

        Notification notification = Notification.builder()
                .user(recipient)
                .type(request.getType())
                .title(request.getTitle().trim())
                .message(request.getMessage().trim())
                .targetUrl(normalizeNullableText(request.getTargetUrl()))
                .referenceType(
                        normalizeNullableText(request.getReferenceType())
                )
                .referenceId(request.getReferenceId())
                .deduplicationKey(deduplicationKey)
                .read(false)
                .build();

        Notification savedNotification =
                notificationRepository.save(notification);

        NotificationResponse response =
                NotificationResponse.fromEntity(savedNotification);

        notificationWebSocketService.sendToUser(
                recipient.getEmail(),
                response
        );

        return response;
    }

    /**
     * Lấy danh sách thông báo của một user theo phân trang.
     */
    @Transactional(readOnly = true)
    public Page<NotificationResponse> getNotifications(
            Long userId,
            int page,
            int size
    ) {
        validateUserId(userId);

        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), MAX_PAGE_SIZE);

        Pageable pageable = PageRequest.of(
                safePage,
                safeSize,
                Sort.by(
                        Sort.Direction.DESC,
                        "createdAt"
                )
        );

        return notificationRepository.findByUserId(userId, pageable)
                .map(NotificationResponse::fromEntity);
    }

    /**
     * Lấy 10 thông báo mới nhất để hiển thị dropdown chuông.
     */
    @Transactional(readOnly = true)
    public List<NotificationResponse> getLatestNotifications(
            Long userId
    ) {
        validateUserId(userId);

        return notificationRepository
                .findTop10ByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(NotificationResponse::fromEntity)
                .toList();
    }

    /**
     * Đếm số thông báo chưa đọc.
     */
    @Transactional(readOnly = true)
    public long countUnreadNotifications(Long userId) {
        validateUserId(userId);

        return notificationRepository.countByUserIdAndReadFalse(userId);
    }

    /**
     * Đánh dấu một thông báo đã đọc.
     *
     * findByIdAndUserId đảm bảo user không thể cập nhật
     * thông báo thuộc tài khoản khác.
     */
    @Transactional
    public NotificationResponse markAsRead(
            Long userId,
            Long notificationId
    ) {
        validateUserId(userId);
        validateNotificationId(notificationId);

        Notification notification = notificationRepository
                .findByIdAndUserId(notificationId, userId)
                .orElseThrow(() ->
                        new NotFoundException("Không tìm thấy thông báo")
                );

        notification.markAsRead();

        Notification savedNotification =
                notificationRepository.save(notification);

        return NotificationResponse.fromEntity(savedNotification);
    }

    /**
     * Đánh dấu toàn bộ thông báo của user là đã đọc.
     *
     * Giá trị trả về là số bản ghi được cập nhật.
     */
    @Transactional
    public int markAllAsRead(Long userId) {
        validateUserId(userId);

        return notificationRepository.markAllAsRead(
                userId,
                OffsetDateTime.now()
        );
    }

    /**
     * Xóa một thông báo.
     *
     * Chỉ chủ sở hữu của thông báo mới có thể xóa.
     */
    @Transactional
    public void deleteNotification(
            Long userId,
            Long notificationId
    ) {
        validateUserId(userId);
        validateNotificationId(notificationId);

        Notification notification = notificationRepository
                .findByIdAndUserId(notificationId, userId)
                .orElseThrow(() ->
                        new NotFoundException("Không tìm thấy thông báo")
                );

        notificationRepository.delete(notification);
    }

    /**
     * Kiểm tra một khóa chống trùng đã tồn tại hay chưa.
     *
     * Scheduler và các service nghiệp vụ có thể dùng hàm này
     * trước khi tạo thông báo.
     */
    @Transactional(readOnly = true)
    public boolean existsByDeduplicationKey(
            String deduplicationKey
    ) {
        String normalizedKey =
                normalizeNullableText(deduplicationKey);

        if (normalizedKey == null) {
            return false;
        }

        return notificationRepository
                .existsByDeduplicationKey(normalizedKey);
    }

    /**
     * Xóa các thông báo đã đọc và cũ hơn thời điểm chỉ định.
     *
     * Chưa sử dụng ngay, nhưng có thể dùng cho scheduler dọn dữ liệu.
     */
    @Transactional
    public long deleteOldReadNotifications(
            OffsetDateTime before
    ) {
        Objects.requireNonNull(
                before,
                "Thời điểm giới hạn không được để trống"
        );

        return notificationRepository
                .deleteByReadTrueAndCreatedAtBefore(before);
    }

    private void validateCreateRequest(
            CreateNotificationRequest request
    ) {
        if (request == null) {
            throw new BadRequestException(
                    "Dữ liệu tạo thông báo không được để trống"
            );
        }

        validateUserId(request.getUserId());

        if (request.getType() == null) {
            throw new BadRequestException(
                    "Loại thông báo không được để trống"
            );
        }

        if (request.getTitle() == null
                || request.getTitle().isBlank()) {
            throw new BadRequestException(
                    "Tiêu đề thông báo không được để trống"
            );
        }

        if (request.getTitle().trim().length() > 255) {
            throw new BadRequestException(
                    "Tiêu đề thông báo không được vượt quá 255 ký tự"
            );
        }

        if (request.getMessage() == null
                || request.getMessage().isBlank()) {
            throw new BadRequestException(
                    "Nội dung thông báo không được để trống"
            );
        }

        validateMaximumLength(
                request.getTargetUrl(),
                500,
                "Đường dẫn thông báo"
        );

        validateMaximumLength(
                request.getReferenceType(),
                50,
                "Loại đối tượng tham chiếu"
        );

        validateMaximumLength(
                request.getDeduplicationKey(),
                255,
                "Khóa chống trùng"
        );
    }

    private void validateUserId(Long userId) {
        if (userId == null || userId <= 0) {
            throw new BadRequestException(
                    "ID tài khoản không hợp lệ"
            );
        }
    }

    private void validateNotificationId(Long notificationId) {
        if (notificationId == null || notificationId <= 0) {
            throw new BadRequestException(
                    "ID thông báo không hợp lệ"
            );
        }
    }

    private void validateMaximumLength(
            String value,
            int maximumLength,
            String fieldName
    ) {
        if (value != null
                && value.trim().length() > maximumLength) {
            throw new BadRequestException(
                    fieldName
                            + " không được vượt quá "
                            + maximumLength
                            + " ký tự"
            );
        }
    }

    private String normalizeNullableText(String value) {
        if (value == null) {
            return null;
        }

        String normalizedValue = value.trim();

        return normalizedValue.isEmpty()
                ? null
                : normalizedValue;
    }
}