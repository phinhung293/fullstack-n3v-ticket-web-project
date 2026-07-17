package com.n3v.ticket.services;

import com.n3v.ticket.entities.EventSeat;
import com.n3v.ticket.entities.Order;
import com.n3v.ticket.entities.OrderItem;
import com.n3v.ticket.entities.User;
import com.n3v.ticket.enums.OrderStatus;
import com.n3v.ticket.enums.SeatStatus;
import com.n3v.ticket.repositories.EventZoneRepository;
import com.n3v.ticket.repositories.EventSeatRepository;
import com.n3v.ticket.repositories.OrderItemRepository;
import com.n3v.ticket.repositories.OrderRepository;
import com.n3v.ticket.repositories.PaymentRepository;
import com.n3v.ticket.dto.CheckoutRequest;
import com.n3v.ticket.dto.order.OrderResponse;
import com.n3v.ticket.dto.order.OrderStatusResponse;
import com.n3v.ticket.entities.EventZone;
import com.n3v.ticket.entities.Payment;
import com.n3v.ticket.common.exception.ConflictException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import vn.payos.PayOS;
import vn.payos.model.v2.paymentRequests.PaymentLink;
import vn.payos.model.v2.paymentRequests.PaymentLinkStatus;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final EventSeatRepository eventSeatRepository;
    private final EventZoneRepository eventZoneRepository;
    private final PaymentRepository paymentRepository;
    private final TicketService ticketService;
    private final PayOS payOS;

    @Transactional
    public Order createOrder(User user, CheckoutRequest request) {
        if ((request.getSeatIds() == null || request.getSeatIds().isEmpty()) &&
                (request.getZones() == null || request.getZones().isEmpty())) {
            throw new RuntimeException("Giỏ hàng rỗng");
        }

        java.math.BigDecimal totalAmount = java.math.BigDecimal.ZERO;
        List<OrderItem> itemsToSave = new ArrayList<>();

        Order order = Order.builder()
                .orderCode(String.valueOf(System.currentTimeMillis() % 9000000000L))
                .user(user)
                .status(OrderStatus.PENDING)
                .build();

        // Cần lưu order trước để có reference trong OrderItem
        // Tạm set số tiền bằng 0 để save
        order.setTotalAmount(java.math.BigDecimal.ZERO);
        order.setFinalAmount(java.math.BigDecimal.ZERO);
        order = orderRepository.save(order);

        // 1. Xử lý ghế (seat map)
        if (request.getSeatIds() != null && !request.getSeatIds().isEmpty()) {
            for (Long seatId : request.getSeatIds()) {
                EventSeat seat = eventSeatRepository.findByIdWithPessimisticLock(seatId)
                        .orElseThrow(() -> new RuntimeException("Không tìm thấy ghế ID: " + seatId));

                if (seat.getStatus() != SeatStatus.AVAILABLE) {
                    throw new RuntimeException("Ghế " + seat.getSeatCode() + " đã được đặt hoặc đang giữ chỗ.");
                }

                seat.setStatus(SeatStatus.LOCKED);
                eventSeatRepository.save(seat);

                java.math.BigDecimal seatPrice = seat.getPrice() != null ? seat.getPrice() : seat.getEventZone().getPrice();

                totalAmount = totalAmount.add(seatPrice);

                OrderItem item = OrderItem.builder()
                        .order(order)
                        .seat(seat)
                        .unitPrice(seatPrice)
                        .quantity(1)
                        .subtotal(seatPrice)
                        .build();
                itemsToSave.add(item);
            }
        }

        // 2. Xử lý zone (không chọn ghế)
        if (request.getZones() != null && !request.getZones().isEmpty()) {
            for (CheckoutRequest.ZoneSelection selection : request.getZones()) {
                EventZone zone = eventZoneRepository.findById(selection.getZoneId())
                        .orElseThrow(() -> new RuntimeException("Không tìm thấy khu vực"));

                // Kiểm tra số lượng
                if (zone.getTotalCapacity() != null && (zone.getSoldCount() + selection.getQuantity() > zone.getTotalCapacity())) {
                    throw new RuntimeException("Khu vực " + zone.getZoneName() + " không đủ vé.");
                }

                // Giữ chỗ (lock) bằng cách tăng soldCount ngay lúc tạo đơn
                zone.setSoldCount(zone.getSoldCount() + selection.getQuantity());
                eventZoneRepository.save(zone);

                java.math.BigDecimal subtotal = zone.getPrice().multiply(new java.math.BigDecimal(selection.getQuantity()));
                totalAmount = totalAmount.add(subtotal);

                OrderItem item = OrderItem.builder()
                        .order(order)
                        .eventZone(zone)
                        .unitPrice(zone.getPrice())
                        .quantity(selection.getQuantity())
                        .subtotal(subtotal)
                        .build();
                itemsToSave.add(item);
            }
        }

        if (order.getOrderItems() == null) {
            order.setOrderItems(new ArrayList<>());
        }
        order.getOrderItems().clear();
        order.getOrderItems().addAll(itemsToSave);
        orderItemRepository.saveAll(itemsToSave);
        order.setTotalAmount(totalAmount);
        order.setFinalAmount(totalAmount);
        return orderRepository.save(order);
    }

    @Transactional
    public void markOrderSuccess(String orderCode) {
        Order order = orderRepository.findByOrderCodeForUpdate(orderCode)
                .orElseThrow(() ->
                        new RuntimeException("Không tìm thấy đơn hàng"));

        List<OrderItem> items =
                orderItemRepository.findByOrderId(order.getId());

        if (order.getStatus() == OrderStatus.SUCCESS) {
            ticketService.issueTicketsForOrder(order, items);
            return;
        }

        boolean reservationWasReleased =
                order.getStatus() == OrderStatus.FAILED
                        || order.getStatus() == OrderStatus.CANCELLED;

        if (order.getStatus() != OrderStatus.PENDING
                && !reservationWasReleased) {
            throw new ConflictException(
                    "Đơn hàng không thể chuyển sang thành công"
            );
        }

        for (OrderItem item : items) {
            if (item.getSeat() != null) {
                EventSeat seat = eventSeatRepository
                        .findByIdWithPessimisticLock(
                                item.getSeat().getId()
                        )
                        .orElseThrow(() ->
                                new ConflictException(
                                        "Ghế của đơn hàng không còn tồn tại"
                                )
                        );

                if (reservationWasReleased
                        && seat.getStatus() != SeatStatus.AVAILABLE) {
                    throw new ConflictException(
                            "PayOS đã xác nhận thanh toán nhưng ghế "
                                    + seat.getSeatCode()
                                    + " đã được giữ bởi đơn khác. "
                                    + "Cần xử lý hoàn tiền thủ công."
                    );
                }

                seat.setStatus(SeatStatus.SOLD);
                eventSeatRepository.save(seat);
            } else if (reservationWasReleased
                    && item.getEventZone() != null) {
                EventZone zone = eventZoneRepository
                        .findByIdForUpdate(item.getEventZone().getId())
                        .orElseThrow(() ->
                                new ConflictException(
                                        "Khu vực vé không còn tồn tại"
                                )
                        );

                int soldCount = zone.getSoldCount() != null
                        ? zone.getSoldCount()
                        : 0;
                int quantity = item.getQuantity() != null
                        ? item.getQuantity()
                        : 1;

                if (zone.getTotalCapacity() != null
                        && soldCount + quantity
                        > zone.getTotalCapacity()) {
                    throw new ConflictException(
                            "PayOS đã xác nhận thanh toán nhưng khu vực "
                                    + zone.getZoneName()
                                    + " không còn đủ vé. "
                                    + "Cần xử lý hoàn tiền thủ công."
                    );
                }

                zone.setSoldCount(soldCount + quantity);
                eventZoneRepository.save(zone);
            }
        }

        order.setStatus(OrderStatus.SUCCESS);
        orderRepository.save(order);

        ticketService.issueTicketsForOrder(order, items);
    }

    @Transactional
    public void markOrderFailed(String orderCode) {
        Order order = orderRepository.findByOrderCodeForUpdate(orderCode)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng"));

        if (order.getStatus() != OrderStatus.PENDING) return;

        order.setStatus(OrderStatus.FAILED);
        orderRepository.save(order);

        List<OrderItem> items = orderItemRepository.findByOrderId(order.getId());
        for (OrderItem item : items) {
            if (item.getSeat() != null) {
                EventSeat seat = eventSeatRepository
                        .findByIdWithPessimisticLock(
                                item.getSeat().getId()
                        )
                        .orElse(null);

                if (seat != null
                        && seat.getStatus() == SeatStatus.LOCKED) {
                    seat.setStatus(SeatStatus.AVAILABLE);
                    eventSeatRepository.save(seat);
                }
            } else if (item.getEventZone() != null) {
                // Hủy đơn hàng -> trả lại vé vào soldCount
                EventZone zone = eventZoneRepository
                        .findByIdForUpdate(item.getEventZone().getId())
                        .orElse(null);

                if (zone != null) {
                    int soldCount = zone.getSoldCount() != null
                            ? zone.getSoldCount()
                            : 0;
                    int quantity = item.getQuantity() != null
                            ? item.getQuantity()
                            : 1;

                    zone.setSoldCount(
                            Math.max(0, soldCount - quantity)
                    );
                    eventZoneRepository.save(zone);
                }
            }
        }
    }

    // Cron job runs every 1 minute
    @Scheduled(fixedRate = 60000)
    @Transactional
    public void releaseExpiredSeats() {
        LocalDateTime now = LocalDateTime.now();
        List<Order> expiredOrders = orderRepository.findByStatusAndExpiredAtBefore(OrderStatus.PENDING, now);

        for (Order order : expiredOrders) {
            if (mustKeepOrderWhilePayOsIsUnsettled(order)) {
                continue;
            }

            log.info("Hủy đơn hàng hết hạn: {}", order.getOrderCode());
            markOrderFailed(order.getOrderCode());
        }
    }

    /**
     * Không được hủy đơn local khi link PayOS vẫn có khả năng nhận tiền.
     * Với link còn PENDING, phải hủy link PayOS trước rồi mới trả tồn kho.
     * Nếu không gọi được PayOS, giữ đơn lại để tránh nhận tiền nhưng mất vé.
     */
    private boolean mustKeepOrderWhilePayOsIsUnsettled(Order order) {
        Payment payment = paymentRepository
                .findByOrderId(order.getId())
                .orElse(null);

        if (payment == null) {
            return false;
        }

        if ("PAID".equals(payment.getStatus())) {
            return true;
        }

        try {
            long payOsOrderCode = Long.parseLong(
                    payment.getTransactionId()
            );

            PaymentLink paymentLink = payOS
                    .paymentRequests()
                    .get(payOsOrderCode);

            if (isProviderPaymentUnsettled(paymentLink.getStatus())) {
                updatePaymentFromProvider(payment, paymentLink);
                return true;
            }

            if (paymentLink.getStatus() == PaymentLinkStatus.PENDING) {
                PaymentLink cancelledLink = payOS
                        .paymentRequests()
                        .cancel(
                                payOsOrderCode,
                                "Đơn hàng quá thời gian thanh toán"
                        );

                updatePaymentFromProvider(payment, cancelledLink);

                return isProviderPaymentUnsettled(
                        cancelledLink.getStatus()
                ) || cancelledLink.getStatus()
                        == PaymentLinkStatus.PENDING;
            }

            updatePaymentFromProvider(payment, paymentLink);
            return false;
        } catch (Exception exception) {
            log.warn(
                    "Không hủy đơn {} vì chưa đối soát được PayOS",
                    order.getOrderCode(),
                    exception
            );
            return true;
        }
    }

    private boolean isProviderPaymentUnsettled(
            PaymentLinkStatus status
    ) {
        return status == PaymentLinkStatus.PAID
                || status == PaymentLinkStatus.UNDERPAID
                || status == PaymentLinkStatus.PROCESSING;
    }

    private void updatePaymentFromProvider(
            Payment payment,
            PaymentLink paymentLink
    ) {
        payment.setStatus(paymentLink.getStatus().getValue());

        try {
            payment.setResponseData(
                    new ObjectMapper().writeValueAsString(paymentLink)
            );
        } catch (Exception exception) {
            log.warn(
                    "Không thể lưu phản hồi PayOS của đơn {}",
                    payment.getOrder().getOrderCode(),
                    exception
            );
        }

        paymentRepository.save(payment);
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> getOrdersByUser(User user) {
        List<Order> orders = orderRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        return orders.stream().map(this::mapToOrderResponse).toList();
    }

    @Transactional(readOnly = true)
    public OrderStatusResponse getOrderStatus(
            String orderCode,
            User user
    ) {
        Order order = orderRepository
                .findByOrderCodeAndUserId(orderCode, user.getId())
                .orElseThrow(() ->
                        new com.n3v.ticket.common.exception.NotFoundException(
                                "Không tìm thấy đơn hàng"
                        )
                );

        Payment payment = paymentRepository
                .findByOrderId(order.getId())
                .orElse(null);

        return OrderStatusResponse.builder()
                .orderCode(order.getOrderCode())
                .orderStatus(order.getStatus().name())
                .paymentStatus(
                        payment != null ? payment.getStatus() : null
                )
                .ticketsReady(order.getStatus() == OrderStatus.SUCCESS)
                .build();
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> getAllOrdersForAdmin() {
        List<Order> orders = orderRepository.findAllByOrderByCreatedAtDesc();
        return orders.stream().map(this::mapToOrderResponse).toList();
    }

    private OrderResponse mapToOrderResponse(Order order) {
        ObjectMapper mapper = new ObjectMapper();
        String eventName = "Sự kiện N3V";
        String ticketDetails = "";
        int totalTickets = 0;

        if (!order.getOrderItems().isEmpty()) {
            OrderItem firstItem = order.getOrderItems().get(0);
            if (firstItem.getSeat() != null) {
                eventName = firstItem.getSeat().getEventZone().getEvent().getName();
                List<String> seats = new ArrayList<>();
                for (OrderItem item : order.getOrderItems()) {
                    if (item.getSeat() != null) {
                        seats.add(item.getSeat().getSeatCode());
                        totalTickets += item.getQuantity();
                    }
                }
                ticketDetails = "Ghế: " + String.join(", ", seats);
            } else if (firstItem.getEventZone() != null) {
                EventZone zone = firstItem.getEventZone();
                if (zone != null) {
                    eventName = zone.getEvent().getName();
                }
                List<String> zones = new ArrayList<>();
                for (OrderItem item : order.getOrderItems()) {
                    if (item.getEventZone() != null) {
                        EventZone z = item.getEventZone();
                        if (z != null) {
                            zones.add(z.getZoneName() + " (x" + item.getQuantity() + ")");
                        }
                        totalTickets += item.getQuantity();
                    }
                }
                ticketDetails = "Khu vực: " + String.join(", ", zones);
            }
        }

        String checkoutUrl = null;
        if (order.getStatus() == OrderStatus.PENDING) {
            Payment payment = paymentRepository.findByOrderId(order.getId()).orElse(null);
            if (payment != null && payment.getResponseData() != null) {
                try {
                    JsonNode node = mapper.readTree(payment.getResponseData());
                    if (node.has("checkoutUrl")) {
                        checkoutUrl = node.get("checkoutUrl").asText();
                    }
                } catch (Exception e) {
                    log.error("Failed to parse payment response data", e);
                }
            }
        }

        return OrderResponse.builder()
                .orderCode(order.getOrderCode())
                .status(order.getStatus().name())
                .totalAmount(order.getFinalAmount())
                .eventName(eventName)
                .ticketDetails(ticketDetails)
                .checkoutUrl(checkoutUrl)
                .createdAt(order.getCreatedAt())
                .customerName(order.getUser() != null ? order.getUser().getFullName() : null)
                .customerEmail(order.getUser() != null ? order.getUser().getEmail() : null)
                .customerPhone(order.getUser() != null ? order.getUser().getPhone() : null)
                .totalTickets(totalTickets)
                .build();
    }
    @Transactional(readOnly = true)
    public List<OrderResponse> getRecentOrdersForAdmin() {
        return orderRepository
                .findTop5ByOrderByCreatedAtDesc()
                .stream()
                .map(this::mapToOrderResponse)
                .toList();
    }
}
