package com.n3v.ticket.dto.checkin;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class CheckInEventResponse {

    private Long id;
    private String name;
    private String thumbnailUrl;
    private String venueName;
    private String address;

    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private LocalDateTime checkInOpenAt;
    private LocalDateTime checkInCloseAt;

    private String eventStatus;
    private String checkInStatus;

    private long totalTickets;
    private long checkedInTickets;
    private long remainingTickets;
}
