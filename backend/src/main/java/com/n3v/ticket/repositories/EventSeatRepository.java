package com.n3v.ticket.repositories;

import com.n3v.ticket.entities.EventSeat;
import com.n3v.ticket.enums.SeatStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;

import java.util.List;
import java.util.Optional;

public interface EventSeatRepository extends JpaRepository<EventSeat, Long> {
    List<EventSeat> findByEventZoneIdOrderBySeatRowAscSeatColumnAsc(Long zoneId);
    List<EventSeat> findByEventZoneIdAndStatus(Long zoneId, SeatStatus status);
    long countByEventZoneId(Long zoneId);
    boolean existsByEventZoneIdAndSeatCodeIgnoreCase(Long zoneId, String seatCode);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM EventSeat s WHERE s.id = :id")
    Optional<EventSeat> findByIdWithPessimisticLock(@Param("id") Long id);
}
