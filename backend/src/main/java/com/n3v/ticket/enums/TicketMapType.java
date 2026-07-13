package com.n3v.ticket.enums;

/**
 * Loai so do ban ve - tuong ung 3 loai neu trong de bai:
 * 1. SEAT_MAP   -> So do ghe (hang/so ghe cu the, vd rap hat, hoi truong).
 * 2. ZONE       -> So do khu vuc (mua theo khu, khong chon ghe cu the, vd concert dung).
 * 3. TEA_LOUNGE -> So do phong tra (mua theo ban, moi ban co suc chua nhieu nguoi).
 */
public enum TicketMapType {
    SEAT_MAP,
    ZONE,
    TEA_LOUNGE
}
