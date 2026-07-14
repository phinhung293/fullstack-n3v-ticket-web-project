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
import vn.payos.type.CheckoutResponseData;
import vn.payos.type.ItemData;
import vn.payos.type.PaymentData;
import vn.payos.type.Webhook;
import vn.payos.type.WebhookData;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {
    private final PayOS payOS;
    private final PaymentRepository paymentRepository;
    private final OrderService orderService;
    private final EmailService emailService;

    public String createPaymentLink(Order order, String returnUrl, String cancelUrl) throws Exception {
        String eventName = order.getOrderItems().get(0).getSeat().getEventZone().getEvent().getName();
        ItemData item = ItemData.builder()
                .name("Vé " + eventName)
                .quantity(1)
                .price(order.getFinalAmount().intValue())
                .build();

        long payOsOrderCode = Long.parseLong(order.getOrderCode());

        PaymentData paymentData = PaymentData.builder()
                .orderCode(payOsOrderCode)
                .amount(order.getFinalAmount().intValue())
                .description("Thanh toan ve N3V")
                .returnUrl(returnUrl)
                .cancelUrl(cancelUrl)
                .item(item)
                .build();

        CheckoutResponseData data = payOS.createPaymentLink(paymentData);

        Payment payment = Payment.builder()
                .order(order)
                .paymentMethod(PaymentMethod.PAYOS)
                .amount(order.getFinalAmount())
                .status("PENDING")
                .transactionId(String.valueOf(data.getOrderCode()))
                .build();
        paymentRepository.save(payment);

        return data.getCheckoutUrl();
    }

    public ObjectNode handleWebhook(ObjectNode webhookBody) {
        ObjectMapper objectMapper = new ObjectMapper();
        ObjectNode response = objectMapper.createObjectNode();
        try {
            Webhook webhook = objectMapper.treeToValue(webhookBody, Webhook.class);
            WebhookData data = payOS.verifyPaymentWebhookData(webhook);

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
