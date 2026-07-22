package com.n3v.ticket.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.n3v.ticket.dto.notification.CreateNotificationRequest;
import com.n3v.ticket.common.exception.BadRequestException;
import com.n3v.ticket.common.exception.ConflictException;
import com.n3v.ticket.entities.Order;
import com.n3v.ticket.entities.Payment;
import com.n3v.ticket.entities.Role;
import com.n3v.ticket.entities.User;
import com.n3v.ticket.enums.NotificationType;
import com.n3v.ticket.enums.OrderStatus;
import com.n3v.ticket.enums.PaymentMethod;
import com.n3v.ticket.repositories.PaymentRepository;
import com.n3v.ticket.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import vn.payos.PayOS;
import vn.payos.model.webhooks.Webhook;
import vn.payos.model.webhooks.WebhookData;
import vn.payos.model.v2.paymentRequests.PaymentLink;
import vn.payos.model.v2.paymentRequests.PaymentLinkStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {
    private final PayOS payOS;
    private final PaymentRepository paymentRepository;
    private final OrderService orderService;
    private final EmailService emailService;
    private final NotificationService notificationService;
    private final UserRepository userRepository;
    private final PayPalService paypalService;

    public String createPaymentLink(Order order, String returnUrl, String cancelUrl) throws Exception {
        String eventName = "Sự kiện N3V";
        if (!order.getOrderItems().isEmpty()) {
            var firstItem = order.getOrderItems().get(0);
            if (firstItem.getSeat() != null) {
                eventName = firstItem.getSeat().getEventZone().getEvent().getName();
            } else if (firstItem.getEventZone() != null) {
                var zone = firstItem.getEventZone();
                if (zone != null) {
                    eventName = zone.getEvent().getName();
                }
            }
        }
        long payOsAmount = order.getFinalAmount().longValue() / 1000;

        vn.payos.model.v2.paymentRequests.PaymentLinkItem item = vn.payos.model.v2.paymentRequests.PaymentLinkItem.builder()
                .name("Vé " + eventName)
                .quantity(1)
                .price(payOsAmount)
                .build();

        long payOsOrderCode = Long.parseLong(order.getOrderCode());

        vn.payos.model.v2.paymentRequests.CreatePaymentLinkRequest paymentData = vn.payos.model.v2.paymentRequests.CreatePaymentLinkRequest.builder()
                .orderCode(payOsOrderCode)
                .amount(payOsAmount)
                .description("Thanh toan ve N3V")
                .returnUrl(returnUrl)
                .cancelUrl(cancelUrl)
                .item(item)
                .build();

        vn.payos.model.v2.paymentRequests.CreatePaymentLinkResponse data = payOS.paymentRequests().create(paymentData);

        Payment payment = Payment.builder()
                .order(order)
                .paymentMethod(PaymentMethod.PAYOS)
                .amount(order.getFinalAmount())
                .status("PENDING")
                .transactionId(String.valueOf(data.getOrderCode()))
                .responseData("{\"checkoutUrl\": \"" + data.getCheckoutUrl() + "\"}")
                .build();
        paymentRepository.save(payment);

        return data.getCheckoutUrl();
    }

    @Transactional
    public ObjectNode handleWebhook(ObjectNode webhookBody) {
        ObjectMapper objectMapper = new ObjectMapper();
        WebhookData data;

        try {
            Webhook webhook = objectMapper.treeToValue(webhookBody, Webhook.class);
            data = payOS.webhooks().verify(webhook);
        } catch (Exception e) {
            log.warn("Webhook PayOS không hợp lệ", e);
            throw new BadRequestException("Webhook PayOS không hợp lệ");
        }

        /*
         * Webhook hop le nhung khong phai giao dich thanh cong:
         * xac nhan da nhan, khong phat hanh ve.
         */
        if (!"00".equals(data.getCode())) {
            return createWebhookResponse(objectMapper, "Ignored");
        }

        String payOsOrderCode = String.valueOf(data.getOrderCode());

        Payment payment = paymentRepository
                .findByTransactionIdForUpdate(payOsOrderCode)
                .orElseThrow(() ->
                        new BadRequestException(
                                "Không tìm thấy giao dịch PayOS"
                        )
                );

        if (isAlreadyCompleted(payment)) {
            return createWebhookResponse(objectMapper, "Already processed");
        }

        completeConfirmedPayment(
                payment,
                BigDecimal.valueOf(data.getAmount()),
                webhookBody.toString()
        );

        return createWebhookResponse(objectMapper, "Ok");
    }

    /**
     * Chủ động hỏi đối soát khi người mua mở trang trạng thái đơn hàng.
     */
    @Transactional
    public void reconcileOrderPayment(
            String orderCode,
            Long userId
    ) {
        if (orderCode == null
                || orderCode.isBlank()
                || userId == null) {
            return;
        }

        Payment payment = paymentRepository
                .findByOrderCodeAndUserIdForUpdate(
                        orderCode,
                        userId
                )
                .orElse(null);

        if (payment == null || isAlreadyCompleted(payment)) {
            return;
        }

        if (payment.getPaymentMethod() == PaymentMethod.PAYPAL) {
            try {
                paypalService.capturePayment(payment.getTransactionId());
            } catch (Exception exception) {
                log.warn("Chưa thể đối soát PayPal cho đơn hàng {}", orderCode, exception);
            }
            return;
        }

        if (payment.getPaymentMethod() != PaymentMethod.PAYOS) {
            return;
        }

        PaymentLink paymentLink;
        String providerResponse;

        try {
            paymentLink = payOS.paymentRequests().get(
                    Long.parseLong(payment.getTransactionId())
            );
            providerResponse = new ObjectMapper()
                    .writeValueAsString(paymentLink);
        } catch (Exception exception) {
            /*
             * Không biến lỗi mạng PayOS thành lỗi 500 của trang trạng thái.
             * Webhook hoặc lần bấm "Kiểm tra lại" tiếp theo vẫn có thể xử lý.
             */
            log.warn(
                    "Chưa thể đối soát PayOS cho đơn hàng {}",
                    orderCode,
                    exception
            );
            return;
        }

        if (paymentLink.getStatus() != PaymentLinkStatus.PAID) {
            return;
        }

        completeConfirmedPayment(
                payment,
                BigDecimal.valueOf(paymentLink.getAmountPaid()),
                providerResponse
        );
    }

    private void completeConfirmedPayment(
            Payment payment,
            BigDecimal providerAmount,
            String providerResponse
    ) {
        Order order = payment.getOrder();

        if (isAlreadyCompleted(payment)) {
            return;
        }

        BigDecimal expectedPayOsAmount = BigDecimal.valueOf(
                payment.getAmount().longValue() / 1000
        );

        if (expectedPayOsAmount.compareTo(providerAmount) != 0) {
            throw new BadRequestException(
                    "Số tiền PayOS không khớp với đơn hàng"
            );
        }

        if (order.getStatus() != OrderStatus.PENDING
                && order.getStatus() != OrderStatus.FAILED
                && order.getStatus() != OrderStatus.CANCELLED) {
            throw new ConflictException(
                    "Đơn hàng không thể chuyển sang trạng thái thành công"
            );
        }

        payment.setStatus("PAID");
        payment.setPaymentDate(LocalDateTime.now());
        payment.setResponseData(providerResponse);
        paymentRepository.save(payment);

        /*
         * markOrderSuccess có thể khôi phục giữ chỗ nếu job hết hạn
         * đã hủy nhầm đơn trước khi PayOS được đối soát.
         */
        orderService.markOrderSuccess(order.getOrderCode());

        notifyPaymentSuccess(order);
        scheduleTicketEmailAfterCommit(order.getId());
    }

    private boolean isAlreadyCompleted(Payment payment) {
        return payment != null
                && "PAID".equals(payment.getStatus())
                && payment.getOrder() != null
                && payment.getOrder().getStatus() == OrderStatus.SUCCESS;
    }

    /**
     * Vé và trạng thái thanh toán phải được commit thành công trước khi gửi email.
     * Nếu giao dịch DB rollback, khách sẽ không nhận một file vé không tồn tại.
     */
    private void scheduleTicketEmailAfterCommit(Long orderId) {
        if (TransactionSynchronizationManager
                .isActualTransactionActive()
                && TransactionSynchronizationManager
                .isSynchronizationActive()) {

            TransactionSynchronizationManager.registerSynchronization(
                    new TransactionSynchronization() {
                        @Override
                        public void afterCommit() {
                            sendTicketEmailSafely(orderId);
                        }
                    }
            );
            return;
        }

        sendTicketEmailSafely(orderId);
    }

    private void sendTicketEmailSafely(Long orderId) {
        try {
            emailService.sendTicketEmail(orderId);
        } catch (Exception exception) {
            /*
             * Thanh toán đã commit nên lỗi SMTP không được làm webhook trả 500
             * và khiến PayOS gửi lại giao dịch thành công.
             */
            log.error(
                    "Không thể gửi email vé cho đơn hàng {} sau khi commit",
                    orderId,
                    exception
            );
        }
    }

    private ObjectNode createWebhookResponse(
            ObjectMapper objectMapper,
            String message
    ) {
        ObjectNode response = objectMapper.createObjectNode();
        response.put("error", 0);
        response.put("message", message);
        return response;
    }

    private void notifyPaymentSuccess(Order order) {
        if (order == null || order.getUser() == null) {
            log.warn(
                    "Không thể tạo notification thanh toán vì order hoặc user null"
            );
            return;
        }

        User customer = order.getUser();

        /*
         * Thông báo cho user.
         */
        notificationService.createNotification(
                CreateNotificationRequest.builder()
                        .userId(customer.getId())
                        .type(NotificationType.PAYMENT_SUCCESS)
                        .title("Thanh toán thành công")
                        .message(
                                "Đơn hàng "
                                        + order.getOrderCode()
                                        + " đã được thanh toán thành công. "
                                        + "Vé điện tử của bạn đã sẵn sàng."
                        )
                        .targetUrl("/my-tickets")
                        .referenceType("ORDER")
                        .referenceId(order.getId())
                        .deduplicationKey(
                                "PAYMENT_SUCCESS_ORDER_"
                                        + order.getId()
                                        + "_USER_"
                                        + customer.getId()
                        )
                        .build()
        );

        /*
         * Thông báo cho toàn bộ admin.
         */
        List<User> admins =
                userRepository.findByRole_Name(Role.ADMIN);

        for (User admin : admins) {
            notificationService.createNotification(
                    CreateNotificationRequest.builder()
                            .userId(admin.getId())
                            .type(
                                    NotificationType.ADMIN_NEW_PAID_ORDER
                            )
                            .title(
                                    "Có đơn hàng mới thanh toán thành công"
                            )
                            .message(
                                    customer.getFullName()
                                            + " đã thanh toán đơn hàng "
                                            + order.getOrderCode()
                                            + " với số tiền "
                                            + order.getFinalAmount()
                                            + " VNĐ."
                            )
                            .targetUrl("/admin")
                            .referenceType("ORDER")
                            .referenceId(order.getId())
                            .deduplicationKey(
                                    "ADMIN_PAID_ORDER_"
                                            + order.getId()
                                            + "_ADMIN_"
                                            + admin.getId()
                            )
                            .build()
            );
        }
    }
}
