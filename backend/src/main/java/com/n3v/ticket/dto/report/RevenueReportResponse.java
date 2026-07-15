package com.n3v.ticket.dto.report;

import com.n3v.ticket.dto.dashboard.RevenueChartResponse;
import com.n3v.ticket.dto.dashboard.TicketChartResponse;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Getter
@Builder
public class RevenueReportResponse {

    private LocalDate fromDate;
    private LocalDate toDate;

    private BigDecimal totalRevenue;
    private long successfulOrders;

    private long totalTickets;
    private long checkedInTickets;
    private double checkInRate;

    private List<RevenueChartResponse> dailyRevenue;
    private List<TicketChartResponse> dailyTickets;
}