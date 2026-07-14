package com.n3v.ticket.controllers;

import com.n3v.ticket.common.ApiResponse;
import com.n3v.ticket.entities.Order;
import com.n3v.ticket.entities.User;
import com.n3v.ticket.repositories.UserRepository;
import com.n3v.ticket.services.OrderService;
import com.n3v.ticket.services.PaymentService;
import com.n3v.ticket.dto.CheckoutRequest;
import lombok.RequiredArgsConstructor;
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

    @PostMapping("/checkout")
    public ApiResponse<?> checkout(Authentication auth, @RequestBody CheckoutRequest request) {
        try {
            User user = userRepository.findByEmail(auth.getName())
                    .orElseThrow(() -> new RuntimeException("User not found"));
            Order order = orderService.createOrder(user, request);
            
            String returnUrl = "http://localhost:5173/booking-status/" + order.getOrderCode() + "?status=success";
            String cancelUrl = "http://localhost:5173/booking-status/" + order.getOrderCode() + "?status=cancel";
            
            String checkoutUrl = paymentService.createPaymentLink(order, returnUrl, cancelUrl);
            
            return ApiResponse.success("Tạo đơn hàng thành công", Map.of(
                    "orderCode", order.getOrderCode(),
                    "checkoutUrl", checkoutUrl
            ));
        } catch (Exception e) {
            e.printStackTrace();
            return ApiResponse.error(400, e.toString());
        }
    }

    @PutMapping("/{orderCode}/success")
    public ApiResponse<?> markOrderSuccess(@PathVariable String orderCode) {
        try {
            orderService.markOrderSuccess(orderCode);
            return ApiResponse.success("Cập nhật trạng thái thành công", null);
        } catch (Exception e) {
            e.printStackTrace();
            return ApiResponse.error(400, e.getMessage());
        }
    }

    @PutMapping("/{orderCode}/cancel")
    public ApiResponse<?> markOrderCancel(@PathVariable String orderCode) {
        try {
            orderService.markOrderFailed(orderCode);
            return ApiResponse.success("Đã huỷ đơn hàng", null);
        } catch (Exception e) {
            e.printStackTrace();
            return ApiResponse.error(400, e.getMessage());
        }
    }

    @GetMapping("/my-orders")
    public ApiResponse<List<com.n3v.ticket.dto.OrderResponse>> getMyOrders(Authentication auth) {
        try {
            User user = userRepository.findByEmail(auth.getName())
                    .orElseThrow(() -> new RuntimeException("User not found"));
            List<com.n3v.ticket.dto.OrderResponse> orders = orderService.getOrdersByUser(user);
            return ApiResponse.success("Lấy danh sách đơn hàng thành công", orders);
        } catch (Exception e) {
            e.printStackTrace();
            return ApiResponse.error(400, e.getMessage());
        }
    }
}
