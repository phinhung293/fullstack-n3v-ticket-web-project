package com.n3v.ticket.enums;

/**
 * Dung chung cho EventSeat:
 * - SEAT  -> 1 ghe = 1 nguoi (dung cho TicketMapType.SEAT_MAP)
 * - TABLE -> 1 ban = N nguoi, co field capacity (dung cho TicketMapType.TEA_LOUNGE)
 */
public enum SeatType {
    SEAT,
    TABLE
}
