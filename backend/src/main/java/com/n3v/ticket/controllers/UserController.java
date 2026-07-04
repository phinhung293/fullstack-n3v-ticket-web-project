package com.n3v.ticket.controllers;

import com.n3v.ticket.common.ApiResponse;
import com.n3v.ticket.dto.user.AvatarRequest;
import com.n3v.ticket.dto.user.ChangePasswordRequest;
import com.n3v.ticket.dto.user.UpdateProfileRequest;
import com.n3v.ticket.dto.user.UserResponse;
import com.n3v.ticket.services.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/profile")
    public ApiResponse<UserResponse> getProfile(Authentication auth) {
        return ApiResponse.success(userService.getProfile(auth.getName()));
    }

    @PutMapping("/profile")
    public ApiResponse<UserResponse> updateProfile(Authentication auth, @Valid @RequestBody UpdateProfileRequest req) {
        return ApiResponse.success("Cập nhật thành công", userService.updateProfile(auth.getName(), req));
    }

    // ============ ĐỔI MẬT KHẨU ============

    @PutMapping("/change-password")
    public ApiResponse<Void> changePassword(Authentication auth, @Valid @RequestBody ChangePasswordRequest req) {
        userService.changePassword(auth.getName(), req);
        return ApiResponse.successMessage("Đổi mật khẩu thành công");
    }

    // ============ CẬP NHẬT AVATAR ============
    @PutMapping("/avatar")
    public ApiResponse<UserResponse> updateAvatar(Authentication auth, @Valid @RequestBody AvatarRequest req) {
        return ApiResponse.success("Cập nhật ảnh đại diện thành công", userService.updateAvatar(auth.getName(), req));
    }
}