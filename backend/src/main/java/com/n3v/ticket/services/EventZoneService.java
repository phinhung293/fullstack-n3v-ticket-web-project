package com.n3v.ticket.services;

import com.n3v.ticket.common.exception.BadRequestException;
import com.n3v.ticket.common.exception.NotFoundException;
import com.n3v.ticket.dto.event.EventZoneRequest;
import com.n3v.ticket.dto.event.EventZoneResponse;
import com.n3v.ticket.entities.Event;
import com.n3v.ticket.entities.EventZone;
import com.n3v.ticket.enums.TicketMapType;
import com.n3v.ticket.repositories.EventRepository;
import com.n3v.ticket.repositories.EventZoneRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class EventZoneService {

    private final EventZoneRepository zoneRepository;
    private final EventRepository eventRepository;

    private EventZone findEntity(Long eventId, Long zoneId) {
        EventZone zone = zoneRepository.findById(zoneId)
                .orElseThrow(() -> new NotFoundException("Khong tim thay khu vuc id = " + zoneId));
        if (!zone.getEvent().getId().equals(eventId)) {
            throw new NotFoundException("Khu vuc id = " + zoneId + " khong thuoc su kien id = " + eventId);
        }
        return zone;
    }

    public List<EventZoneResponse> getByEvent(Long eventId) {
        if (!eventRepository.existsById(eventId)) {
            throw new NotFoundException("Khong tim thay su kien id = " + eventId);
        }
        return zoneRepository.findByEventIdOrderByDisplayOrderAsc(eventId)
                .stream()
                .map(z -> EventZoneResponse.from(z, false))
                .toList();
    }

    public EventZoneResponse getById(Long eventId, Long zoneId) {
        return EventZoneResponse.from(findEntity(eventId, zoneId), true);
    }

    public EventZoneResponse create(Long eventId, EventZoneRequest req) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new NotFoundException("Khong tim thay su kien id = " + eventId));

        if (zoneRepository.existsByEventIdAndZoneNameIgnoreCase(eventId, req.getZoneName())) {
            throw new BadRequestException("Khu vuc \"" + req.getZoneName() + "\" da ton tai trong su kien nay");
        }

        // Voi TicketMapType.ZONE, totalCapacity la bat buoc vi khong co EventSeat con
        // de suy ra suc chua.
        if (event.getTicketMapType() == TicketMapType.ZONE && req.getTotalCapacity() == null) {
            throw new BadRequestException("Su kien kieu ZONE bat buoc phai nhap suc chua (totalCapacity)");
        }

        EventZone zone = EventZone.builder()
                .event(event)
                .zoneName(req.getZoneName())
                .description(req.getDescription())
                .totalCapacity(req.getTotalCapacity())
                .soldCount(0)
                .price(req.getPrice())
                .displayOrder(req.getDisplayOrder() == null ? 0 : req.getDisplayOrder())
                .active(true)
                .build();

        return EventZoneResponse.from(zoneRepository.save(zone), false);
    }

    public EventZoneResponse update(Long eventId, Long zoneId, EventZoneRequest req) {
        EventZone zone = findEntity(eventId, zoneId);

        zone.setZoneName(req.getZoneName());
        zone.setDescription(req.getDescription());
        zone.setTotalCapacity(req.getTotalCapacity());
        zone.setPrice(req.getPrice());
        if (req.getDisplayOrder() != null) {
            zone.setDisplayOrder(req.getDisplayOrder());
        }

        return EventZoneResponse.from(zoneRepository.save(zone), false);
    }

    public void delete(Long eventId, Long zoneId) {
        EventZone zone = findEntity(eventId, zoneId);
        // cascade = ALL + orphanRemoval tren Event.zones / EventZone.seats se tu dong
        // xoa cac EventSeat con thuoc zone nay.
        zoneRepository.delete(zone);
    }
}
