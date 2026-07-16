package com.n3v.ticket.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.n3v.ticket.dto.notification.CreateNotificationRequest;
import com.n3v.ticket.entities.Order;
import com.n3v.ticket.entities.Payment;
import com.n3v.ticket.entities.Role;
import com.n3v.ticket.entities.User;
import com.n3v.ticket.enums.NotificationType;
import com.n3v.ticket.enums.PaymentMethod;
import com.n3v.ticket.repositories.PaymentRepository;
import com.n3v.ticket.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import vn.payos.PayOS;
import vn.payos.model.webhooks.Webhook;
import vn.payos.model.webhooks.WebhookData;
import org.springframework.transaction.annotation.Transactional;

import com.n3v.ticket.repositories.EventZoneRepository;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {
    private final PayOS payOS;
    private final PaymentRepository paymentRepository;
    private final OrderService orderService;
    private final EmailService emailService;
    private final EventZoneRepository eventZoneRepository;
    private final NotificationService notificationService;
    private final UserRepository userRepository;

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
        ObjectNode response = objectMapper.createObjectNode();
        try {
            Webhook webhook = objectMapper.treeToValue(webhookBody, Webhook.class);
            WebhookData data = payOS.webhooks().verify(webhook);

            if ("00".equals(data.getCode())) {
                String payOsOrderCode = String.valueOf(data.getOrderCode());
                Payment payment = paymentRepository.findByTransactionId(payOsOrderCode)
                        .orElseThrow(() -> new RuntimeException("Payment not found"));

                payment.setStatus("PAID");
                payment.setResponseData(webhookBody.toString());
                paymentRepository.save(payment);

                Order order = payment.getOrder();
                orderService.markOrderSuccess(order.getOrderCode());

                notifyPaymentSuccess(order);

                // Trigger email
                emailService.sendTicketEmail(order);
                
                response.put("error", 0);
                response.put("message", "Ok");
                return response;
            }
        } catch (Exception e) {
            log.error("Webhook processing failed", e);
        }
        response.put("error", 1);
        response.put("message", "Failed");
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
