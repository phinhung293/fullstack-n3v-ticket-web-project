package com.n3v.ticket.services;

import com.n3v.ticket.common.exception.BadRequestException;
import com.n3v.ticket.dto.dashboard.DashboardSummaryResponse;
import com.n3v.ticket.dto.dashboard.RevenueChartResponse;
import com.n3v.ticket.dto.dashboard.TicketChartResponse;
import com.n3v.ticket.enums.OrderStatus;
import com.n3v.ticket.enums.TicketStatus;
import com.n3v.ticket.repositories.DailyTicketProjection;
import com.n3v.ticket.repositories.ETicketRepository;
import com.n3v.ticket.repositories.OrderRepository;
import com.n3v.ticket.dto.dashboard.UpcomingEventDashboardResponse;
import com.n3v.ticket.entities.Event;
import com.n3v.ticket.enums.EventStatus;
import com.n3v.ticket.enums.TicketMapType;
import com.n3v.ticket.repositories.EventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final OrderRepository orderRepository;
    private final ETicketRepository eTicketRepository;
    private final EventRepository eventRepository;

    @Transactional(readOnly = true)
    public DashboardSummaryResponse getSummary() {
        BigDecimal totalRevenue =
                orderRepository.calculateTotalRevenue();

        long successfulOrders =
                orderRepository.countByStatus(OrderStatus.SUCCESS);

        long totalTickets =
                eTicketRepository.count();

        long checkedInTickets =
                eTicketRepository.countByStatus(
                        TicketStatus.CHECKED_IN
                );

        double checkInRate = totalTickets == 0
                ? 0.0
                : (checkedInTickets * 100.0) / totalTickets;

        checkInRate =
                Math.round(checkInRate * 100.0) / 100.0;

        return DashboardSummaryResponse.builder()
                .totalRevenue(
                        totalRevenue != null
                                ? totalRevenue
                                : BigDecimal.ZERO
                )
                .successfulOrders(successfulOrders)
                .totalTickets(totalTickets)
                .checkedInTickets(checkedInTickets)
                .checkInRate(checkInRate)
                .build();
    }

    @Transactional(readOnly = true)
    public List<RevenueChartResponse> getDailyRevenue(int days) {
        if (days < 1 || days > 365) {
            throw new BadRequestException(
                    "Số ngày thống kê phải nằm trong khoảng từ 1 đến 365"
            );
        }

        LocalDate today = LocalDate.now();
        LocalDate startDate = today.minusDays(days - 1L);

        LocalDateTime fromDate = startDate.atStartOfDay();
        LocalDateTime toDate = today.plusDays(1).atStartOfDay();

        Map<LocalDate, BigDecimal> revenueByDate =
                orderRepository.getDailyRevenue(fromDate, toDate)
                        .stream()
                        .collect(Collectors.toMap(
                                item -> item.getDate(),
                                item -> item.getRevenue() != null
                                        ? item.getRevenue()
                                        : BigDecimal.ZERO
                        ));

        return IntStream.range(0, days)
                .mapToObj(index -> {
                    LocalDate date = startDate.plusDays(index);

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

    @Transactional(readOnly = true)
    public List<TicketChartResponse> getDailyTicketCount(int days) {
        if (days < 1 || days > 365) {
            throw new BadRequestException(
                    "Số ngày thống kê phải nằm trong khoảng từ 1 đến 365"
            );
        }

        LocalDate today = LocalDate.now();
        LocalDate startDate = today.minusDays(days - 1L);

        LocalDateTime fromDate = startDate.atStartOfDay();
        LocalDateTime toDate = today.plusDays(1).atStartOfDay();

        Map<LocalDate, Long> ticketCountByDate =
                eTicketRepository.getDailyTicketCount(fromDate, toDate)
                        .stream()
                        .collect(Collectors.toMap(
                                DailyTicketProjection::getDate,
                                item -> item.getTicketCount() != null
                                        ? item.getTicketCount()
                                        : 0L
                        ));

        return IntStream.range(0, days)
                .mapToObj(index -> {
                    LocalDate date = startDate.plusDays(index);

                    return new TicketChartResponse(
                            date,
                            ticketCountByDate.getOrDefault(date, 0L)
                    );
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public List<UpcomingEventDashboardResponse> getUpcomingEvents() {
        LocalDateTime now = LocalDateTime.now();

        return eventRepository
                .findTop5ByStatusInAndEndTimeGreaterThanEqualOrderByStartTimeAsc(
                        List.of(
                                EventStatus.PUBLISHED,
                                EventStatus.ONGOING
                        ),
                        now
                )
                .stream()
                .map(this::mapUpcomingEvent)
                .toList();
    }

    private UpcomingEventDashboardResponse mapUpcomingEvent(Event event) {
        int totalCapacity = event.getZones()
                .stream()
                .mapToInt(zone -> {
                    if (event.getTicketMapType() == TicketMapType.ZONE) {
                        return zone.getTotalCapacity() != null
                                ? zone.getTotalCapacity()
                                : 0;
                    }

                    return zone.getSeats() != null
                            ? zone.getSeats().size()
                            : 0;
                })
                .sum();

        long soldTickets =
                eTicketRepository.countByEventIdAndStatusIn(
                        event.getId(),
                        List.of(
                                TicketStatus.ISSUED,
                                TicketStatus.CHECKED_IN
                        )
                );

        double salesRate = totalCapacity == 0
                ? 0
                : soldTickets * 100.0 / totalCapacity;

        salesRate = Math.round(salesRate * 100.0) / 100.0;

        return UpcomingEventDashboardResponse.builder()
                .id(event.getId())
                .name(event.getName())
                .startTime(event.getStartTime())
                .venueName(event.getVenueName())
                .city(event.getCity())
                .soldTickets(soldTickets)
                .totalCapacity(totalCapacity)
                .salesRate(salesRate)
                .status(event.getStatus())
                .build();
    }
}