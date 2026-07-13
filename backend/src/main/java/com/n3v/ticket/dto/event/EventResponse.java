package com.n3v.ticket.dto.event;

import com.n3v.ticket.common.EventTimeUtils;
import com.n3v.ticket.dto.category.CategoryResponse;
import com.n3v.ticket.entities.Event;
import com.n3v.ticket.entities.EventZone;
import com.n3v.ticket.enums.EventStatus;
import com.n3v.ticket.enums.TicketMapType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Dung cho trang chi tiet su kien (khach) va man hinh sua su kien (admin) -
 * co day du thong tin + danh sach zones (moi zone keo theo seats).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EventResponse {
    private Long id;
    private String name;
    private String description;
    private String thumbnailUrl;
    private String bannerUrl;
    private CategoryResponse category;
    private String venueName;
    private String address;
    private String city;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private LocalDateTime saleStartTime;
    private LocalDateTime saleEndTime;
    private TicketMapType ticketMapType;
    private EventStatus status;
    // Da qua han mua ve (saleEndTime) nhung su kien chua dien ra xong. Tinh o backend
    // (khong luu DB) de tranh lech gio client/server - xem EventTimeUtils.
    // API cong khai (PublicEventController) se AN hoan toan Event co isExpired = true
    // khoi ca danh sach lan chi tiet; field nay chu yeu phuc vu man hinh Admin.
    private boolean isExpired;
    private Long createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<EventZoneResponse> zones;

    public static EventResponse from(Event event) {
        if (event == null) return null;

        List<EventZoneResponse> zoneResponses = event.getZones().stream()
                .sorted(Comparator.comparing(EventZone::getDisplayOrder, Comparator.nullsLast(Comparator.naturalOrder())))
                .map(z -> EventZoneResponse.from(z, true))
                .collect(Collectors.toList());

        return EventResponse.builder()
                .id(event.getId())
                .name(event.getName())
                .description(event.getDescription())
                .thumbnailUrl(event.getThumbnailUrl())
                .bannerUrl(event.getBannerUrl())
                .category(CategoryResponse.from(event.getCategory()))
                .venueName(event.getVenueName())
                .address(event.getAddress())
                .city(event.getCity())
                .startTime(event.getStartTime())
                .endTime(event.getEndTime())
                .saleStartTime(event.getSaleStartTime())
                .saleEndTime(event.getSaleEndTime())
                .ticketMapType(event.getTicketMapType())
                .status(event.getStatus())
                .isExpired(EventTimeUtils.isExpired(event.getSaleEndTime(), event.getEndTime()))
                .createdBy(event.getCreatedBy())
                .createdAt(event.getCreatedAt())
                .updatedAt(event.getUpdatedAt())
                .zones(zoneResponses)
                .build();
    }
}
