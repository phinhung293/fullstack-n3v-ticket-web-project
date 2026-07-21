package com.n3v.ticket.dto.ticket;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;

@Getter
@Builder
public class TicketResponse {

    private Long id;
    private String ticketCode;
    private String status;

    private String eventName;
    private String eventThumbnail;
    private String venueName;
    private String address;

    private LocalDateTime eventStartTime;

    private String zoneName;
    private String seatCode;

    private OffsetDateTime checkedInAt;
    private OffsetDateTime createdAt;
}