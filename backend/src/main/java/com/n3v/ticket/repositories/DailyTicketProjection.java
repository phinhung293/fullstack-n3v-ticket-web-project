package com.n3v.ticket.repositories;

import java.time.LocalDate;

public interface DailyTicketProjection {

    LocalDate getDate();

    Long getTicketCount();
}