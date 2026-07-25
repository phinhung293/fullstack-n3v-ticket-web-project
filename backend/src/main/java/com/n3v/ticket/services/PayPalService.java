package com.n3v.ticket.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.n3v.ticket.common.exception.BadRequestException;
import com.n3v.ticket.dto.notification.CreateNotificationRequest;
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
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class PayPalService {

    private final PaymentRepository paymentRepository;
    private final OrderService orderService;
    private final EmailService emailService;
    private final NotificationService notificationService;
    private final UserRepository userRepository;

    @Value("${paypal.client-id:YOUR_SANDBOX_CLIENT_ID}")
    private String clientId;

    @Value("${paypal.client-secret:YOUR_SANDBOX_CLIENT_SECRET}")
    private String clientSecret;

    @Value("${paypal.base-url:https://api-m.sandbox.paypal.com}")
    private String baseUrl;

    @Value("${paypal.exchange-rate:25.0}")
    private double exchangeRate;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public String getAccessToken() {
        try {
            String url = baseUrl + "/v1/oauth2/token";
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
            headers.setBasicAuth(clientId, clientSecret);

            MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
            body.add("grant_type", "client_credentials");

            HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);
            ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                JsonNode jsonNode = objectMapper.readTree(response.getBody());
                return jsonNode.get("access_token").asText();
            } else {
                throw new BadRequestException("Không thể lấy Access Token từ PayPal API");
            }
        } catch (Exception e) {
            log.error("Lỗi khi lấy access token PayPal", e);
            throw new BadRequestException("Lỗi kết nối tới dịch vụ PayPal: " + e.getMessage());
        }
    }

    @Transactional
    public String createPaymentLink(Order order, String returnUrl, String cancelUrl) {
        // 1. Tính toán usdAmount theo công thức: (finalAmount / 1000.0) / exchangeRate
        double usdAmount = (order.getFinalAmount().doubleValue() / 1000.0) / exchangeRate;
        String usdAmountStr = String.format(Locale.US, "%.2f", usdAmount);

        log.info("Quy đổi giá vé orderCode={}: {} VND -> {} USD (Tỷ giá {})",
                order.getOrderCode(), order.getFinalAmount(), usdAmountStr, exchangeRate);

        try {
            String token = getAccessToken();
            String url = baseUrl + "/v2/checkout/orders";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(token);

            Map<String, Object> amountMap = new HashMap<>();
            amountMap.put("currency_code", "USD");
            amountMap.put("value", usdAmountStr);

            Map<String, Object> purchaseUnit = new HashMap<>();
            purchaseUnit.put("amount", amountMap);
            purchaseUnit.put("description", "Thanh toan ve N3V - Don hang #" + order.getOrderCode());

            Map<String, Object> appContext = new HashMap<>();
            appContext.put("return_url", returnUrl);
            appContext.put("cancel_url", cancelUrl);

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("intent", "CAPTURE");
            requestBody.put("purchase_units", List.of(purchaseUnit));
            requestBody.put("application_context", appContext);

            HttpEntity<String> entity = new HttpEntity<>(objectMapper.writeValueAsString(requestBody), headers);
            ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);

            if (response.getStatusCode() == HttpStatus.CREATED || response.getStatusCode() == HttpStatus.OK) {
                JsonNode root = objectMapper.readTree(response.getBody());
                String paypalOrderId = root.get("id").asText();

                String approveUrl = null;
                JsonNode linksNode = root.get("links");
                if (linksNode != null && linksNode.isArray()) {
                    for (JsonNode link : linksNode) {
                        if ("approve".equalsIgnoreCase(link.get("rel").asText())) {
                            approveUrl = link.get("href").asText();
                            break;
                        }
                    }
                }

                if (approveUrl == null) {
                    throw new BadRequestException("PayPal không trả về approveUrl");
                }

                Payment payment = Payment.builder()
                        .order(order)
                        .paymentMethod(PaymentMethod.PAYPAL)
                        .amount(order.getFinalAmount())
                        .status("PENDING")
                        .transactionId(paypalOrderId)
                        .responseData("{\"checkoutUrl\": \"" + approveUrl + "\"}")
                        .build();

                paymentRepository.save(payment);

                return approveUrl;
            } else {
                throw new BadRequestException("Không thể tạo Order trên PayPal API");
            }
        } catch (Exception e) {
            log.error("Lỗi khi tạo liên kết thanh toán PayPal cho đơn {}", order.getOrderCode(), e);
            throw new BadRequestException("Lỗi khởi tạo thanh toán PayPal: " + e.getMessage());
        }
    }

    @Transactional
    public void capturePayment(String paypalOrderId) {
        if (paypalOrderId == null || paypalOrderId.isBlank()) {
            throw new BadRequestException("Mã đơn hàng PayPal không hợp lệ");
        }

        // Idempotency check: Kiểm tra trong DB trước khi gọi API Capture
        Optional<Payment> existingPaymentOpt = paymentRepository.findByTransactionIdForUpdate(paypalOrderId);
        if (existingPaymentOpt.isPresent()) {
            Payment payment = existingPaymentOpt.get();
            if ("PAID".equals(payment.getStatus())
                    && payment.getOrder() != null
                    && payment.getOrder().getStatus() == OrderStatus.SUCCESS) {
                log.info("Đơn hàng PayPal {} đã được capture và xác nhận trước đó (Idempotency triggered)", paypalOrderId);
                return;
            }
        }

        try {
            String token = getAccessToken();
            String url = baseUrl + "/v2/checkout/orders/" + paypalOrderId + "/capture";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(token);

            HttpEntity<String> entity = new HttpEntity<>("{}", headers);
            ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);

            if (response.getStatusCode() == HttpStatus.OK || response.getStatusCode() == HttpStatus.CREATED) {
                JsonNode root = objectMapper.readTree(response.getBody());
                String status = root.get("status").asText();

                if ("COMPLETED".equalsIgnoreCase(status)) {
                    Payment payment = paymentRepository.findByTransactionIdForUpdate(paypalOrderId)
                            .orElseThrow(() -> new BadRequestException("Không tìm thấy giao dịch PayPal tương ứng"));

                    if ("PAID".equals(payment.getStatus()) && payment.getOrder().getStatus() == OrderStatus.SUCCESS) {
                        return;
                    }

                    payment.setStatus("PAID");
                    payment.setPaymentDate(LocalDateTime.now());
                    payment.setResponseData(response.getBody());
                    paymentRepository.save(payment);

                    Order order = payment.getOrder();
                    orderService.markOrderSuccess(order.getOrderCode());

                    notifyPaymentSuccess(order);
                    scheduleTicketEmailAfterCommit(order.getId());
                } else {
                    log.warn("Trạng thái PayPal Capture không phải COMPLETED: {}", status);
                    throw new BadRequestException("Thanh toán PayPal chưa hoàn tất (Trạng thái: " + status + ")");
                }
            } else {
                throw new BadRequestException("Gọi API Capture PayPal thất bại");
            }
        } catch (org.springframework.web.client.HttpClientErrorException e) {
            String responseBody = e.getResponseBodyAsString();
            if (responseBody != null && responseBody.contains("ORDER_NOT_APPROVED")) {
                log.info("Đơn hàng PayPal {} chưa được người mua chấp nhận thanh toán (ORDER_NOT_APPROVED)", paypalOrderId);
                return;
            }
            log.error("Lỗi HTTP khi Capture đơn hàng PayPal {}: {}", paypalOrderId, responseBody, e);
            throw new BadRequestException("Lỗi từ cổng thanh toán PayPal: " + e.getMessage());
        } catch (BadRequestException bre) {
            throw bre;
        } catch (Exception e) {
            log.error("Lỗi khi Capture đơn hàng PayPal {}", paypalOrderId, e);
            throw new BadRequestException("Không thể xác nhận thanh toán với PayPal: " + e.getMessage());
        }
    }

    private void scheduleTicketEmailAfterCommit(Long orderId) {
        if (TransactionSynchronizationManager.isActualTransactionActive()
                && TransactionSynchronizationManager.isSynchronizationActive()) {
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
            log.error("Không thể gửi email vé cho đơn hàng {} sau khi commit", orderId, exception);
        }
    }

    private void notifyPaymentSuccess(Order order) {
        if (order == null || order.getUser() == null) {
            log.warn("Không thể tạo notification thanh toán vì order hoặc user null");
            return;
        }

        User customer = order.getUser();

        notificationService.createNotification(
                CreateNotificationRequest.builder()
                        .userId(customer.getId())
                        .type(NotificationType.PAYMENT_SUCCESS)
                        .title("Thanh toán thành công")
                        .message("Đơn hàng " + order.getOrderCode() + " đã được thanh toán PayPal thành công. Vé điện tử của bạn đã sẵn sàng.")
                        .targetUrl("/my-tickets")
                        .referenceType("ORDER")
                        .referenceId(order.getId())
                        .deduplicationKey("PAYMENT_SUCCESS_ORDER_" + order.getId() + "_USER_" + customer.getId())
                        .build()
        );

        List<User> admins = userRepository.findByRole_Name(Role.ADMIN);
        for (User admin : admins) {
            notificationService.createNotification(
                    CreateNotificationRequest.builder()
                            .userId(admin.getId())
                            .type(NotificationType.ADMIN_NEW_PAID_ORDER)
                            .title("Có đơn hàng mới thanh toán PayPal thành công")
                            .message(customer.getFullName() + " đã thanh toán đơn hàng " + order.getOrderCode() + " qua PayPal với số tiền " + order.getFinalAmount() + " VNĐ.")
                            .targetUrl("/admin")
                            .referenceType("ORDER")
                            .referenceId(order.getId())
                            .deduplicationKey("ADMIN_PAID_ORDER_" + order.getId() + "_ADMIN_" + admin.getId())
                            .build()
            );
        }
    }
}
