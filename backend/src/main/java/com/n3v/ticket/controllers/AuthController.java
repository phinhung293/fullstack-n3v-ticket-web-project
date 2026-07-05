package com.n3v.ticket.controllers;

import com.n3v.ticket.common.ApiResponse;
import com.n3v.ticket.dto.auth.*;
import com.n3v.ticket.services.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ApiResponse<Void> register(@Valid @RequestBody RegisterRequest req) {
        authService.register(req);
        return ApiResponse.successMessage("Mã OTP xác thực đăng ký đã được gửi vào email");
    }

    @PostMapping("/register/verify-email")
    public ApiResponse<AuthResponse> verifyRegisterOtp(@Valid @RequestBody VerifyOtpRequest req) {
        return ApiResponse.success("Xác thực email thành công", authService.verifyRegisterOtp(req));
    }

    @PostMapping("/login")
    public ApiResponse<AuthResponse> login(@Valid @RequestBody LoginRequest req) {
        return ApiResponse.success("Đăng nhập thành công", authService.login(req));
    }

    // ============ QUÊN MẬT KHẨU ============

    @PostMapping("/forgot-password/send-code")
    public ApiResponse<Void> sendCode(@Valid @RequestBody ForgotPasswordRequest req) {
        authService.sendResetCode(req);
        return ApiResponse.successMessage("Mã xác minh đã được gửi vào email");
    }

    @PostMapping("/forgot-password/verify-code")
    public ApiResponse<Void> verifyCode(@Valid @RequestBody VerifyOtpRequest req) {
        authService.verifyOtpCode(req);
        return ApiResponse.successMessage("Mã xác minh hợp lệ");
    }

    @PostMapping("/forgot-password/reset")
    public ApiResponse<Void> resetPassword(@Valid @RequestBody ResetPasswordRequest req) {
        authService.resetPassword(req);
        return ApiResponse.successMessage("Đặt lại mật khẩu thành công");
    }
}