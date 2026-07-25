package com.n3v.ticket.dto.dashboard;

import com.n3v.ticket.enums.EventStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpcomingEventDashboardResponse {

    private Long id;
    private String name;
    private LocalDateTime startTime;
    private String venueName;
    private String city;
    private long soldTickets;
    private int totalCapacity;
    private double salesRate;
    private EventStatus status;
}