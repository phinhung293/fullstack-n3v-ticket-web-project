package com.n3v.ticket.enums;

/**
 * Loai ghe theo gia/vi tri, dung cho TicketMapType.SEAT_MAP (Concert, Nghe thuat).
 * VIP      -> gia cao hon, thuong o gan san khau.
 * STANDARD -> gia thap hon.
 * <p>
 * Khong dung cho TicketMapType.ZONE (The thao) - loai do khong co seat map,
 * chi ban theo so luong (xem EventZone.totalCapacity/remaining).
 */
public enum SeatTier {
    VIP,
    STANDARD
}
