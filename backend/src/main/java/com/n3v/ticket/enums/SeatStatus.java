package com.n3v.ticket.enums;

/**
 * Trang thai cua 1 ghe/ban tai 1 thoi diem.
 * AVAILABLE -> Con trong, co the dat.
 * LOCKED    -> Dang duoc giu tam (luc khach checkout) - module Dat ve/thanh toan se set.
 * SOLD      -> Da ban.
 * DISABLED  -> Admin khoa (VD ghe hong, giu cho VIP khong ban).
 */
public enum SeatStatus {
    AVAILABLE,
    LOCKED,
    SOLD,
    DISABLED
}
