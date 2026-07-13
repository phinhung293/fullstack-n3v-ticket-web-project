package com.n3v.ticket.repositories;

import com.n3v.ticket.entities.EventZone;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EventZoneRepository extends JpaRepository<EventZone, Long> {
    List<EventZone> findByEventIdOrderByDisplayOrderAsc(Long eventId);
    boolean existsByEventIdAndZoneNameIgnoreCase(Long eventId, String zoneName);
}
