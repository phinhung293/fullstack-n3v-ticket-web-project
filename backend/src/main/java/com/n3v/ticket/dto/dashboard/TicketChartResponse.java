package com.n3v.ticket.dto.dashboard;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDate;

@Getter
@AllArgsConstructor
public class TicketChartResponse {

    private LocalDate date;

    private Long ticketCount;
}