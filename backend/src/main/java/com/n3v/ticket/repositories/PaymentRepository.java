package com.n3v.ticket.repositories;

import com.n3v.ticket.entities.Payment;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    Optional<Payment> findByOrderId(Long orderId);
    Optional<Payment> findByTransactionId(String transactionId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
        SELECT payment
        FROM Payment payment
        JOIN FETCH payment.order ticketOrder
        JOIN FETCH ticketOrder.user
        WHERE ticketOrder.orderCode = :orderCode
          AND ticketOrder.user.id = :userId
    """)
    Optional<Payment> findByOrderCodeAndUserIdForUpdate(
            @Param("orderCode") String orderCode,
            @Param("userId") Long userId
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
        SELECT payment
        FROM Payment payment
        JOIN FETCH payment.order
        WHERE payment.transactionId = :transactionId
    """)
    Optional<Payment> findByTransactionIdForUpdate(
            @Param("transactionId") String transactionId
    );
}
