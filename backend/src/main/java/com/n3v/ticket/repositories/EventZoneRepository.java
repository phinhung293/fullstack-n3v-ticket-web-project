package com.n3v.ticket.repositories;

import com.n3v.ticket.entities.EventZone;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface EventZoneRepository extends JpaRepository<EventZone, Long> {
    List<EventZone> findByEventIdOrderByDisplayOrderAsc(Long eventId);
    boolean existsByEventIdAndZoneNameIgnoreCase(Long eventId, String zoneName);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT zone FROM EventZone zone WHERE zone.id = :id")
    Optional<EventZone> findByIdForUpdate(@Param("id") Long id);
}
