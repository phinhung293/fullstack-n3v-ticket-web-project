package com.n3v.ticket.dto.event;
import com.n3v.ticket.entities.EventZone;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EventZoneResponse {
    private Long id;
    private Long eventId;
    private String zoneName;
    private String description;
    private Integer totalCapacity;
    private Integer soldCount;
    private Integer remaining;
    private BigDecimal price;
    private Integer displayOrder;
    private Boolean active;
    // Chi duoc populate khi includeSeats = true (API chi tiet zone / chi tiet event),
    // API list zone theo su kien de null de tranh payload qua nang.
    private List<EventSeatResponse> seats;

    public static EventZoneResponse from(EventZone zone, boolean includeSeats) {
        if (zone == null) return null;
        return EventZoneResponse.builder()
                .id(zone.getId())
                .eventId(zone.getEvent().getId())
                .zoneName(zone.getZoneName())
                .description(zone.getDescription())
                .totalCapacity(zone.getTotalCapacity())
                .soldCount(zone.getSoldCount())
                .remaining(zone.getRemaining())
                .price(zone.getPrice())
                .displayOrder(zone.getDisplayOrder())
                .active(zone.getActive())
                .seats(includeSeats
                        ? zone.getSeats().stream().map(EventSeatResponse::from).collect(Collectors.toList())
                        : Collections.emptyList())
                .build();
    }
}
