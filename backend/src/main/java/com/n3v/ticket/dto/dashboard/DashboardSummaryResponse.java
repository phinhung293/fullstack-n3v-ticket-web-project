package com.n3v.ticket.dto.dashboard;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@Builder
public class DashboardSummaryResponse {

    private BigDecimal totalRevenue;

    private long successfulOrders;

    private long totalTickets;

    private long checkedInTickets;

    private double checkInRate;
}