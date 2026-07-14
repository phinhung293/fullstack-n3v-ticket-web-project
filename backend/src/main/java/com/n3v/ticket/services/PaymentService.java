package com.n3v.ticket.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.n3v.ticket.entities.Order;
import com.n3v.ticket.entities.Payment;
import com.n3v.ticket.enums.PaymentMethod;
import com.n3v.ticket.repositories.PaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import vn.payos.PayOS;
import vn.payos.model.webhooks.Webhook;
import vn.payos.model.webhooks.WebhookData;

import com.n3v.ticket.repositories.EventZoneRepository;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {
    private final PayOS payOS;
    private final PaymentRepository paymentRepository;
    private final OrderService orderService;
    private final EmailService emailService;
    private final EventZoneRepository eventZoneRepository;

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
        vn.payos.model.v2.paymentRequests.PaymentLinkItem item = vn.payos.model.v2.paymentRequests.PaymentLinkItem.builder()
                .name("Vé " + eventName)
                .quantity(1)
                .price(order.getFinalAmount().longValue())
                .build();

        long payOsOrderCode = Long.parseLong(order.getOrderCode());

        vn.payos.model.v2.paymentRequests.CreatePaymentLinkRequest paymentData = vn.payos.model.v2.paymentRequests.CreatePaymentLinkRequest.builder()
                .orderCode(payOsOrderCode)
                .amount(order.getFinalAmount().longValue())
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
}
