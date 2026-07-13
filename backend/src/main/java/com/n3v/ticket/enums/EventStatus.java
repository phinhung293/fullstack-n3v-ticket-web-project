package com.n3v.ticket.enums;

/**
 * Vong doi trang thai cua 1 su kien.
 *
 * DRAFT      -> Moi tao, admin dang cau hinh so do ve, chua hien thi cho khach.
 * PUBLISHED  -> Da public, khach co the xem & (khi toi saleStartTime) dat ve.
 * ONGOING    -> Su kien dang dien ra.
 * COMPLETED  -> Su kien da ket thuc.
 * CANCELLED  -> Su kien bi huy (co the huy tu PUBLISHED hoac ONGOING).
 */
public enum EventStatus {
    DRAFT,
    PUBLISHED,
    ONGOING,
    COMPLETED,
    CANCELLED
}
