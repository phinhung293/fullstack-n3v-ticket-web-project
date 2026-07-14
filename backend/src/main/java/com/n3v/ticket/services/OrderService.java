package com.n3v.ticket.services;

import com.n3v.ticket.entities.EventSeat;
import com.n3v.ticket.entities.Order;
import com.n3v.ticket.entities.OrderItem;
import com.n3v.ticket.entities.User;
import com.n3v.ticket.enums.OrderStatus;
import com.n3v.ticket.enums.SeatStatus;
import com.n3v.ticket.repositories.EventSeatRepository;
import com.n3v.ticket.repositories.OrderItemRepository;
import com.n3v.ticket.repositories.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final EventSeatRepository eventSeatRepository;

    @Transactional
    public Order createOrder(User user, List<Long> seatIds) {
        if (seatIds == null || seatIds.isEmpty()) {
            throw new RuntimeException("Danh sách ghế không hợp lệ");
        }

        // Lock seats
        List<EventSeat> lockedSeats = new ArrayList<>();
        java.math.BigDecimal totalAmount = java.math.BigDecimal.ZERO;

        for (Long seatId : seatIds) {
            // Pessimistic lock
            EventSeat seat = eventSeatRepository.findByIdWithPessimisticLock(seatId)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy ghế ID: " + seatId));

            if (seat.getStatus() != SeatStatus.AVAILABLE) {
                throw new RuntimeException("Ghế " + seat.getSeatCode() + " đã được đặt hoặc đang giữ chỗ.");
            }

            // Lock the seat
            seat.setStatus(SeatStatus.LOCKED);
            eventSeatRepository.save(seat);
            lockedSeats.add(seat);

            java.math.BigDecimal seatPrice = seat.getPrice() != null ? seat.getPrice() : seat.getEventZone().getPrice();
            totalAmount = totalAmount.add(seatPrice);
        }

        // Divide by 1000 for test integration
        totalAmount = totalAmount.divide(new java.math.BigDecimal("1000"));

        Order order = Order.builder()
                .orderCode(String.valueOf(System.currentTimeMillis() % 9000000000L))
                .user(user)
                .totalAmount(totalAmount)
                .discountAmount(java.math.BigDecimal.ZERO)
                .finalAmount(totalAmount)
                .status(OrderStatus.PENDING)
                .build();

        order = orderRepository.save(order);

        for (EventSeat seat : lockedSeats) {
            java.math.BigDecimal seatPrice = seat.getPrice() != null ? seat.getPrice() : seat.getEventZone().getPrice();
            java.math.BigDecimal priceForDb = seatPrice.divide(new java.math.BigDecimal("1000"));
            OrderItem item = OrderItem.builder()
                    .order(order)
                    .seat(seat)
                    .unitPrice(priceForDb)
                    .quantity(1)
                    .subtotal(priceForDb)
                    .build();
            orderItemRepository.save(item);
        }

        return order;
    }

    @Transactional
    public void markOrderSuccess(String orderCode) {
        Order order = orderRepository.findByOrderCode(orderCode)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng"));

        if (order.getStatus() == OrderStatus.SUCCESS) return;

        order.setStatus(OrderStatus.SUCCESS);
        orderRepository.save(order);

        List<OrderItem> items = orderItemRepository.findByOrderId(order.getId());
        for (OrderItem item : items) {
            EventSeat seat = item.getSeat();
            seat.setStatus(SeatStatus.SOLD);
            eventSeatRepository.save(seat);
        }
    }

    @Transactional
    public void markOrderFailed(String orderCode) {
        Order order = orderRepository.findByOrderCode(orderCode)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng"));

        if (order.getStatus() != OrderStatus.PENDING) return;

        order.setStatus(OrderStatus.FAILED);
        orderRepository.save(order);

        List<OrderItem> items = orderItemRepository.findByOrderId(order.getId());
        for (OrderItem item : items) {
            EventSeat seat = item.getSeat();
            seat.setStatus(SeatStatus.AVAILABLE);
            eventSeatRepository.save(seat);
        }
    }

    // Cron job runs every 1 minute
    @Scheduled(fixedRate = 60000)
    @Transactional
    public void releaseExpiredSeats() {
        LocalDateTime now = LocalDateTime.now();
        List<Order> expiredOrders = orderRepository.findByStatusAndExpiredAtBefore(OrderStatus.PENDING, now);

        for (Order order : expiredOrders) {
            log.info("Hủy đơn hàng hết hạn: {}", order.getOrderCode());
            markOrderFailed(order.getOrderCode());
        }
    }
}
