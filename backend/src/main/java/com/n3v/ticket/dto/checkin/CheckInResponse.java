package com.n3v.ticket.dto.checkin;

import lombok.Builder;
import lombok.Getter;

import java.time.OffsetDateTime;

@Getter
@Builder
public class CheckInResponse {

    private boolean success;
    private String message;

    private String ticketCode;
    private String ticketStatus;

    private Long eventId;
    private String customerName;
    private String eventName;
    private String zoneName;
    private String seatCode;

    private OffsetDateTime checkedInAt;
    private String checkedInByName;
}
