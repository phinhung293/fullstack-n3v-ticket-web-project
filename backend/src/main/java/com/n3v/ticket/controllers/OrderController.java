package com.n3v.ticket.controllers;

import com.n3v.ticket.common.ApiResponse;
import com.n3v.ticket.dto.order.OrderResponse;
import com.n3v.ticket.entities.Order;
import com.n3v.ticket.entities.User;
import com.n3v.ticket.repositories.UserRepository;
import com.n3v.ticket.services.OrderService;
import com.n3v.ticket.services.PaymentService;
import com.n3v.ticket.dto.CheckoutRequest;
import com.n3v.ticket.dto.order.OrderStatusResponse;
import com.n3v.ticket.common.exception.BadRequestException;
import com.n3v.ticket.common.exception.NotFoundException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {
    private final OrderService orderService;
    private final PaymentService paymentService;
    private final UserRepository userRepository;

    @Value("${FRONTEND_BASE_URL:http://localhost:5173}")
    private String frontendBaseUrl;

    @PostMapping("/checkout")
    public ApiResponse<?> checkout(
            Authentication auth,
            @Valid @RequestBody CheckoutRequest request
    ) {
        User user = getCurrentUser(auth);
        Order order = orderService.createOrder(user, request);

        String statusUrl = frontendBaseUrl
                + "/booking-status/"
                + order.getOrderCode();

        try {
            String checkoutUrl = paymentService.createPaymentLink(order, statusUrl, statusUrl);

            return ApiResponse.success("Tạo đơn hàng thành công", Map.of(
                    "orderCode", order.getOrderCode(),
                    "checkoutUrl", checkoutUrl
            ));
        } catch (Exception e) {
            orderService.markOrderFailed(order.getOrderCode());
            throw new BadRequestException(
                    "Không thể tạo liên kết thanh toán PayOS"
            );
        }
    }

    @GetMapping("/{orderCode}/status")
    public ApiResponse<OrderStatusResponse> getOrderStatus(
            @PathVariable String orderCode,
            Authentication auth
    ) {
        User user = getCurrentUser(auth);

        /*
         * Webhook là đường xác nhận chính. Lần kiểm tra chủ động này là
         * đường dự phòng khi backend local không nhận được webhook PayOS.
         */
        paymentService.reconcileOrderPayment(
                orderCode,
                user.getId()
        );

        return ApiResponse.success(
                "Lấy trạng thái đơn hàng thành công",
                orderService.getOrderStatus(orderCode, user)
        );
    }

    @GetMapping("/my-orders")
    public ApiResponse<List<OrderResponse>> getMyOrders(Authentication auth) {
        User user = getCurrentUser(auth);
        List<OrderResponse> orders =
                orderService.getOrdersByUser(user);

        return ApiResponse.success(
                "Lấy danh sách đơn hàng thành công",
                orders
        );
    }

    private User getCurrentUser(Authentication authentication) {
        if (authentication == null
                || authentication.getName() == null
                || authentication.getName().isBlank()) {
            throw new NotFoundException(
                    "Không tìm thấy thông tin đăng nhập"
            );
        }

        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() ->
                        new NotFoundException(
                                "Không tìm thấy tài khoản"
                        )
                );
    }
}
