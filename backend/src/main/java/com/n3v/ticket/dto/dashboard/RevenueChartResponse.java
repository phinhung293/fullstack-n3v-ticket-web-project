package com.n3v.ticket.dto.dashboard;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@AllArgsConstructor
public class RevenueChartResponse {

    private LocalDate date;

    private BigDecimal revenue;

}