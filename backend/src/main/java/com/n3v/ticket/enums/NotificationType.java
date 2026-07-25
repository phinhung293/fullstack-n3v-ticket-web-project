package com.n3v.ticket.enums;

/**
 * Các loại thông báo nghiệp vụ của hệ thống N3V Ticket.
 */
public enum NotificationType {

    // User: thanh toán và phát hành vé thành công
    PAYMENT_SUCCESS,

    // User và admin: vé vừa được check-in
    TICKET_CHECKED_IN,

    // User: vé chưa sử dụng đã hết hạn khi sự kiện kết thúc
    TICKET_EXPIRED,

    // User: sự kiện sắp diễn ra
    EVENT_REMINDER,

    // User: sự kiện bị hủy
    EVENT_CANCELLED,

    // User: sự kiện bị thay đổi lịch
    EVENT_RESCHEDULED,

    // Admin: có đơn hàng mới thanh toán thành công
    ADMIN_NEW_PAID_ORDER,

    // Admin: tổng hợp doanh thu và số vé cuối ngày
    ADMIN_DAILY_SUMMARY
}
