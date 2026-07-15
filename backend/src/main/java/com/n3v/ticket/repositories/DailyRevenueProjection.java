package com.n3v.ticket.repositories;

import java.math.BigDecimal;
import java.time.LocalDate;

public interface DailyRevenueProjection {

    LocalDate getDate();

    BigDecimal getRevenue();
}