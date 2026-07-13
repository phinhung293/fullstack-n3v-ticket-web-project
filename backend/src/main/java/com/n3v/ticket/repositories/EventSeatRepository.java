package com.n3v.ticket.repositories;

import com.n3v.ticket.entities.EventSeat;
import com.n3v.ticket.enums.SeatStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EventSeatRepository extends JpaRepository<EventSeat, Long> {
    List<EventSeat> findByEventZoneIdOrderBySeatRowAscSeatColumnAsc(Long zoneId);
    List<EventSeat> findByEventZoneIdAndStatus(Long zoneId, SeatStatus status);
    long countByEventZoneId(Long zoneId);
    boolean existsByEventZoneIdAndSeatCodeIgnoreCase(Long zoneId, String seatCode);
}
