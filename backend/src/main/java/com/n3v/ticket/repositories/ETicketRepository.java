package com.n3v.ticket.repositories;

import com.n3v.ticket.entities.ETicket;
import com.n3v.ticket.enums.TicketStatus;
import com.n3v.ticket.entities.User;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface ETicketRepository extends JpaRepository<ETicket, Long> {

    Optional<ETicket> findByTicketCode(String ticketCode);

    Optional<ETicket> findByQrCodeHash(String qrCodeHash);

    List<ETicket> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<ETicket> findByStatusAndEvent_EndTimeLessThanEqual(
            TicketStatus status,
            LocalDateTime endTime
    );

    List<ETicket> findByEventIdAndStatusIn(
            Long eventId,
            Collection<TicketStatus> statuses
    );

    @Query("""
        SELECT ticket
        FROM ETicket ticket
        JOIN FETCH ticket.orderItem orderItem
        JOIN FETCH orderItem.order ticketOrder
        JOIN FETCH ticketOrder.user
        LEFT JOIN FETCH ticket.event
        LEFT JOIN FETCH ticket.eventZone
        LEFT JOIN FETCH ticket.seat
        WHERE ticketOrder.id = :orderId
        ORDER BY ticket.id ASC
    """)
    List<ETicket> findAllByOrderIdWithEmailDetails(
            @Param("orderId") Long orderId
    );

    boolean existsByOrderItemId(Long orderItemId);

    long countByStatus(TicketStatus status);

    long countByStatusIn(Collection<TicketStatus> statuses);

    long countByCreatedAtBetween(
            OffsetDateTime from,
            OffsetDateTime to
    );

    long countByStatusAndCreatedAtBetween(
            TicketStatus status,
            OffsetDateTime from,
            OffsetDateTime to
    );

    long countByStatusInAndCreatedAtBetween(
            Collection<TicketStatus> statuses,
            OffsetDateTime from,
            OffsetDateTime to
    );

    long countByEventIdAndStatusIn(
            Long eventId,
            Collection<TicketStatus> statuses
    );

    long countByEventIdAndStatus(
            Long eventId,
            TicketStatus status
    );

    @Query(
            value = """
            SELECT
                CAST(et.created_at AS DATE) AS date,
                COUNT(et.id) AS ticketCount
            FROM e_tickets et
            WHERE et.created_at >= :fromDate
              AND et.created_at < :toDate
              AND et.status <> 'CANCELLED'
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
        LEFT JOIN FETCH ticket.orderItem orderItem
        LEFT JOIN FETCH orderItem.order
        WHERE ticket.qrCodeHash = :qrCodeHash
    """)
    Optional<ETicket> findByQrCodeHashForUpdate(
            @Param("qrCodeHash") String qrCodeHash
    );

    /**
     * Lấy danh sách tài khoản đang sở hữu vé của một sự kiện.
     *
     * DISTINCT tránh một user mua nhiều vé nhưng nhận nhiều
     * thông báo giống nhau.
     *
     * Không gửi cho vé đã bị CANCELLED.
     */
    @Query("""
    SELECT DISTINCT ticket.user
    FROM ETicket ticket
    WHERE ticket.event.id = :eventId
      AND ticket.status <> com.n3v.ticket.enums.TicketStatus.CANCELLED
""")
    List<User> findDistinctUsersByEventId(
            @Param("eventId") Long eventId
    );
}
