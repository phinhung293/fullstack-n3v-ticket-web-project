package com.n3v.ticket.controllers;

import com.n3v.ticket.common.ApiResponse;
import com.n3v.ticket.dto.admin.AdminUpdateUserRequest;
import com.n3v.ticket.dto.user.UserResponse;
import com.n3v.ticket.services.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final UserService userService;

    @GetMapping("/ping")
    public ApiResponse<String> ping() {
        return ApiResponse.success("Bạn đang đăng nhập với quyền ADMIN", "pong");
    }

    @GetMapping("/users")
    public ApiResponse<List<UserResponse>> getUsers() {
        return ApiResponse.success(userService.getAllUsersForAdmin());
    }

    @PutMapping("/users/{id}")
    public ApiResponse<UserResponse> updateUser(
            @PathVariable Long id,
            @Valid @RequestBody AdminUpdateUserRequest req
    ) {
        return ApiResponse.success("Cập nhật người dùng thành công", userService.adminUpdateUser(id, req));
    }

    @DeleteMapping("/users/{id}")
    public ApiResponse<Void> deleteUser(@PathVariable Long id, Authentication auth) {
        userService.adminDeleteUser(id, auth.getName());
        return ApiResponse.successMessage("Xóa người dùng thành công");
    }
}