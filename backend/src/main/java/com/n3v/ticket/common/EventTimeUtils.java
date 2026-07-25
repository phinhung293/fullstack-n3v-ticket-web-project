package com.n3v.ticket.common;

import java.time.LocalDateTime;

/**
 * Tinh "het han mua ve" cho 1 Event, dua tren gio server (khong luu DB, tinh
 * ngay luc build response de tranh lech gio client/server).
 *
 * Dinh nghia: het han = da qua saleEndTime NHUNG su kien chua ket thuc (endTime).
 * Neu su kien da ket thuc thi coi la COMPLETED (khong con y nghia "het han mua ve" nua).
 */
public final class EventTimeUtils {

    private EventTimeUtils() {
    }

    public static boolean isExpired(LocalDateTime saleEndTime, LocalDateTime endTime) {
        if (saleEndTime == null) {
            return false;
        }
        LocalDateTime now = LocalDateTime.now();
        boolean saleWindowClosed = now.isAfter(saleEndTime);
        boolean eventNotOverYet = endTime == null || !now.isAfter(endTime);
        return saleWindowClosed && eventNotOverYet;
    }
}
