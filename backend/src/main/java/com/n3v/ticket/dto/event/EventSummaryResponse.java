package com.n3v.ticket.dto.event;

import com.n3v.ticket.common.EventTimeUtils;
import com.n3v.ticket.entities.Event;
import com.n3v.ticket.entities.EventZone;
import com.n3v.ticket.enums.EventStatus;
import com.n3v.ticket.enums.TicketMapType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Comparator;

/**
 * Dung cho danh sach (trang chu, ket qua tim kiem, danh sach quan tri) -
 * nhe hon EventResponse day du, khong keo theo danh sach zones/seats.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EventSummaryResponse {
    private Long id;
    private String name;
    private String thumbnailUrl;
    private String categoryName;
    private String venueName;
    private String city;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private LocalDateTime saleEndTime;
    private TicketMapType ticketMapType;
    private EventStatus status;
    // Xem ghi chu trong EventResponse - API cong khai se AN het cac Event isExpired = true.
    private boolean isExpired;
    // Gia thap nhat trong cac zone - de hien "Tu 150.000d" ngoai danh sach
    private BigDecimal minPrice;

    public static EventSummaryResponse from(Event event) {
        if (event == null) return null;

        BigDecimal minPrice = event.getZones().stream()
                .map(EventZone::getPrice)
                .filter(p -> p != null)
                .min(Comparator.naturalOrder())
                .orElse(null);

        return EventSummaryResponse.builder()
                .id(event.getId())
                .name(event.getName())
                .thumbnailUrl(event.getThumbnailUrl())
                .categoryName(event.getCategory() != null ? event.getCategory().getName() : null)
                .venueName(event.getVenueName())
                .city(event.getCity())
                .startTime(event.getStartTime())
                .endTime(event.getEndTime())
                .saleEndTime(event.getSaleEndTime())
                .ticketMapType(event.getTicketMapType())
                .status(event.getStatus())
                .isExpired(EventTimeUtils.isExpired(event.getSaleEndTime(), event.getEndTime()))
                .minPrice(minPrice)
                .build();
    }
}
