package com.n3v.ticket.controllers;

import com.n3v.ticket.common.ApiResponse;
import com.n3v.ticket.services.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/orders")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminOrderController {

    private final OrderService orderService;

    @GetMapping
    public ApiResponse<?> getAllOrders() {
        try {
            return ApiResponse.success("Lấy danh sách đơn hàng thành công", orderService.getAllOrdersForAdmin());
        } catch (Exception e) {
            return ApiResponse.error(400, "Lỗi khi lấy danh sách đơn hàng");
        }
    }
}
