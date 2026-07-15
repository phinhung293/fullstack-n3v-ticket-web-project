package com.n3v.ticket.repositories;

import com.n3v.ticket.entities.Order;
import com.n3v.ticket.enums.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long> {

    Optional<Order> findByOrderCode(String orderCode);

    List<Order> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<Order> findAllByOrderByCreatedAtDesc();

    List<Order> findByStatusAndExpiredAtBefore(
            OrderStatus status,
            LocalDateTime time
    );

    long countByStatus(OrderStatus status);

    @Query("""
        SELECT COALESCE(SUM(o.finalAmount), 0)
        FROM Order o
        WHERE o.status = com.n3v.ticket.enums.OrderStatus.SUCCESS
    """)
    BigDecimal calculateTotalRevenue();

    @Query("""
    SELECT COALESCE(SUM(o.finalAmount), 0)
    FROM Order o
    WHERE o.status = com.n3v.ticket.enums.OrderStatus.SUCCESS
      AND o.createdAt >= :fromDate
      AND o.createdAt < :toDate
""")
    BigDecimal calculateTotalRevenueBetween(
            @Param("fromDate") LocalDateTime fromDate,
            @Param("toDate") LocalDateTime toDate
    );

    long countByStatusAndCreatedAtGreaterThanEqualAndCreatedAtLessThan(
            OrderStatus status,
            LocalDateTime fromDate,
            LocalDateTime toDate
    );

    @Query(
            value = """
            SELECT
                CAST(o.created_at AS DATE) AS date,
                COALESCE(SUM(o.final_amount), 0) AS revenue
            FROM orders o
            WHERE o.status = 'SUCCESS'
              AND o.created_at >= :fromDate
              AND o.created_at < :toDate
            GROUP BY CAST(o.created_at AS DATE)
            ORDER BY CAST(o.created_at AS DATE)
            """,
            nativeQuery = true
    )
    List<DailyRevenueProjection> getDailyRevenue(
            @Param("fromDate") LocalDateTime fromDate,
            @Param("toDate") LocalDateTime toDate
    );
}