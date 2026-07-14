package com.n3v.ticket.controllers;

import com.n3v.ticket.common.ApiResponse;
import com.n3v.ticket.entities.Order;
import com.n3v.ticket.entities.User;
import com.n3v.ticket.repositories.UserRepository;
import com.n3v.ticket.services.OrderService;
import com.n3v.ticket.services.PaymentService;
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
    public ApiResponse<?> checkout(Authentication auth, @RequestBody List<Long> seatIds) {
        try {
            User user = userRepository.findByEmail(auth.getName())
                    .orElseThrow(() -> new RuntimeException("User not found"));
            Order order = orderService.createOrder(user, seatIds);
            
            String returnUrl = "http://localhost:5173/booking-status/" + order.getOrderCode() + "?status=success";
            String cancelUrl = "http://localhost:5173/booking-status/" + order.getOrderCode() + "?status=cancel";
            
            String checkoutUrl = paymentService.createPaymentLink(order, returnUrl, cancelUrl);
            
            return ApiResponse.success("Tạo đơn hàng thành công", Map.of(
                    "orderCode", order.getOrderCode(),
                    "checkoutUrl", checkoutUrl
            ));
        } catch (Exception e) {
            return ApiResponse.error(400, e.getMessage());
        }
    }
}
