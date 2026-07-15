package com.n3v.ticket.repositories;

import com.n3v.ticket.entities.ETicket;
import com.n3v.ticket.enums.TicketStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

public interface ETicketRepository extends JpaRepository<ETicket, Long> {

    Optional<ETicket> findByTicketCode(String ticketCode);

    Optional<ETicket> findByQrCodeHash(String qrCodeHash);

    List<ETicket> findByUserIdOrderByCreatedAtDesc(Long userId);

    boolean existsByOrderItemId(Long orderItemId);

    long countByStatus(TicketStatus status);

    long countByCreatedAtBetween(
            OffsetDateTime from,
            OffsetDateTime to
    );

    long countByStatusAndCreatedAtBetween(
            TicketStatus status,
            OffsetDateTime from,
            OffsetDateTime to
    );

    @Query(
            value = """
            SELECT
                CAST(et.created_at AS DATE) AS date,
                COUNT(et.id) AS ticketCount
            FROM e_tickets et
            WHERE et.created_at >= :fromDate
              AND et.created_at < :toDate
            GROUP BY CAST(et.created_at AS DATE)
            ORDER BY CAST(et.created_at AS DATE)
            """,
            nativeQuery = true
    )
    List<DailyTicketProjection> getDailyTicketCount(
            @Param("fromDate") LocalDateTime fromDate,
            @Param("toDate") LocalDateTime toDate
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
        SELECT ticket
        FROM ETicket ticket
        LEFT JOIN FETCH ticket.user
        LEFT JOIN FETCH ticket.event
        LEFT JOIN FETCH ticket.eventZone
        LEFT JOIN FETCH ticket.seat
        WHERE ticket.qrCodeHash = :qrCodeHash
    """)
    Optional<ETicket> findByQrCodeHashForUpdate(
            @Param("qrCodeHash") String qrCodeHash
    );
}