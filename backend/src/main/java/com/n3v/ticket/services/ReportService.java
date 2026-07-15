package com.n3v.ticket.services;

import com.n3v.ticket.common.exception.BadRequestException;
import com.n3v.ticket.dto.dashboard.RevenueChartResponse;
import com.n3v.ticket.dto.dashboard.TicketChartResponse;
import com.n3v.ticket.dto.report.RevenueReportResponse;
import com.n3v.ticket.enums.OrderStatus;
import com.n3v.ticket.enums.TicketStatus;
import com.n3v.ticket.repositories.DailyTicketProjection;
import com.n3v.ticket.repositories.ETicketRepository;
import com.n3v.ticket.repositories.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@Service
@RequiredArgsConstructor
public class ReportService {

    private static final int MAX_REPORT_DAYS = 366;

    private final OrderRepository orderRepository;
    private final ETicketRepository eTicketRepository;

    @Transactional(readOnly = true)
    public RevenueReportResponse getRevenueReport(
            LocalDate fromDate,
            LocalDate toDate
    ) {
        validateDateRange(fromDate, toDate);

        LocalDateTime fromDateTime = fromDate.atStartOfDay();
        LocalDateTime toDateTime = toDate.plusDays(1).atStartOfDay();

        ZoneId zoneId = ZoneId.systemDefault();

        OffsetDateTime ticketFromDateTime =
                fromDate.atStartOfDay(zoneId).toOffsetDateTime();

        OffsetDateTime ticketToDateTime =
                toDate.plusDays(1).atStartOfDay(zoneId).toOffsetDateTime();

        BigDecimal totalRevenue =
                orderRepository.calculateTotalRevenueBetween(
                        fromDateTime,
                        toDateTime
                );

        long successfulOrders =
                orderRepository
                        .countByStatusAndCreatedAtGreaterThanEqualAndCreatedAtLessThan(
                                OrderStatus.SUCCESS,
                                fromDateTime,
                                toDateTime
                        );

        long totalTickets =
                eTicketRepository.countByCreatedAtBetween(
                        ticketFromDateTime,
                        ticketToDateTime
                );

        long checkedInTickets =
                eTicketRepository.countByStatusAndCreatedAtBetween(
                        TicketStatus.CHECKED_IN,
                        ticketFromDateTime,
                        ticketToDateTime
                );

        double checkInRate = totalTickets == 0
                ? 0.0
                : checkedInTickets * 100.0 / totalTickets;

        checkInRate = Math.round(checkInRate * 100.0) / 100.0;

        List<RevenueChartResponse> dailyRevenue =
                buildDailyRevenue(
                        fromDate,
                        toDate,
                        fromDateTime,
                        toDateTime
                );

        List<TicketChartResponse> dailyTickets =
                buildDailyTickets(
                        fromDate,
                        toDate,
                        fromDateTime,
                        toDateTime
                );

        return RevenueReportResponse.builder()
                .fromDate(fromDate)
                .toDate(toDate)
                .totalRevenue(
                        totalRevenue != null
                                ? totalRevenue
                                : BigDecimal.ZERO
                )
                .successfulOrders(successfulOrders)
                .totalTickets(totalTickets)
                .checkedInTickets(checkedInTickets)
                .checkInRate(checkInRate)
                .dailyRevenue(dailyRevenue)
                .dailyTickets(dailyTickets)
                .build();
    }

    private List<RevenueChartResponse> buildDailyRevenue(
            LocalDate fromDate,
            LocalDate toDate,
            LocalDateTime fromDateTime,
            LocalDateTime toDateTime
    ) {
        Map<LocalDate, BigDecimal> revenueByDate =
                orderRepository
                        .getDailyRevenue(fromDateTime, toDateTime)
                        .stream()
                        .collect(Collectors.toMap(
                                item -> item.getDate(),
                                item -> item.getRevenue() != null
                                        ? item.getRevenue()
                                        : BigDecimal.ZERO
                        ));

        int totalDays = Math.toIntExact(
                toDate.toEpochDay() - fromDate.toEpochDay() + 1
        );

        return IntStream.range(0, totalDays)
                .mapToObj(index -> {
                    LocalDate date = fromDate.plusDays(index);

                    return new RevenueChartResponse(
                            date,
                            revenueByDate.getOrDefault(
                                    date,
                                    BigDecimal.ZERO
                            )
                    );
                })
                .toList();
    }

    private List<TicketChartResponse> buildDailyTickets(
            LocalDate fromDate,
            LocalDate toDate,
            LocalDateTime fromDateTime,
            LocalDateTime toDateTime
    ) {
        Map<LocalDate, Long> ticketCountByDate =
                eTicketRepository
                        .getDailyTicketCount(
                                fromDateTime,
                                toDateTime
                        )
                        .stream()
                        .collect(Collectors.toMap(
                                DailyTicketProjection::getDate,
                                item -> item.getTicketCount() != null
                                        ? item.getTicketCount()
                                        : 0L
                        ));

        int totalDays = Math.toIntExact(
                toDate.toEpochDay() - fromDate.toEpochDay() + 1
        );

        return IntStream.range(0, totalDays)
                .mapToObj(index -> {
                    LocalDate date = fromDate.plusDays(index);

                    return new TicketChartResponse(
                            date,
                            ticketCountByDate.getOrDefault(date, 0L)
                    );
                })
                .toList();
    }

    private void validateDateRange(
            LocalDate fromDate,
            LocalDate toDate
    ) {
        if (fromDate == null || toDate == null) {
            throw new BadRequestException(
                    "Ngày bắt đầu và ngày kết thúc không được để trống"
            );
        }

        if (fromDate.isAfter(toDate)) {
            throw new BadRequestException(
                    "Ngày bắt đầu không được lớn hơn ngày kết thúc"
            );
        }

        long totalDays =
                toDate.toEpochDay() - fromDate.toEpochDay() + 1;

        if (totalDays > MAX_REPORT_DAYS) {
            throw new BadRequestException(
                    "Khoảng thời gian báo cáo không được vượt quá 366 ngày"
            );
        }
    }
}