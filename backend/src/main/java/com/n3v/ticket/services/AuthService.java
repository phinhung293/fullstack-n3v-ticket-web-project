package com.n3v.ticket.services;

import com.n3v.ticket.common.exception.BadRequestException;
import com.n3v.ticket.common.exception.ConflictException;
import com.n3v.ticket.common.exception.NotFoundException;
import com.n3v.ticket.component.JwtUtils;
import com.n3v.ticket.dto.auth.*;
import com.n3v.ticket.entities.Role;
import com.n3v.ticket.entities.User;
import com.n3v.ticket.repositories.RoleRepository;
import com.n3v.ticket.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.Random;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtils jwtUtils;
    private final EmailService emailService;   // MỚI THÊM

    public AuthResponse register(RegisterRequest req) {
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new ConflictException("Email đã được sử dụng");
        }
        if (userRepository.existsByPhone(req.getPhone())) {
            throw new ConflictException("Số điện thoại đã được sử dụng");
        }

        Role userRole = roleRepository.findByName(Role.USER)
                .orElseThrow(() -> new NotFoundException("Chưa cấu hình vai trò " + Role.USER + " trong hệ thống"));

        User user = User.builder()
                .fullName(req.getFullName())
                .email(req.getEmail())
                .phone(req.getPhone())
                .passwordHash(passwordEncoder.encode(req.getPassword()))
                .role(userRole)
                .status("ACTIVE")
                .build();
        userRepository.save(user);

        String token = jwtUtils.generateToken(user.getEmail(), user.getRoleName(), user.getId());
        return toResponse(user, token);
    }

    public AuthResponse login(LoginRequest req) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(req.getEmail(), req.getPassword())
        );

        User user = userRepository.findByEmail(req.getEmail())
                .orElseThrow(() -> new BadRequestException("Email hoặc mật khẩu không đúng"));

        if (!"ACTIVE".equals(user.getStatus())) {
            throw new BadRequestException("Tài khoản đã bị khóa");
        }

        String token = jwtUtils.generateToken(user.getEmail(), user.getRoleName(), user.getId());
        return toResponse(user, token);
    }

    // ============ QUÊN MẬT KHẨU ============

    public void sendResetCode(ForgotPasswordRequest req) {
        User user = userRepository.findByEmail(req.getEmail())
                .orElseThrow(() -> new NotFoundException("Không tìm thấy tài khoản với email này"));

        String otp = String.valueOf(100000 + new Random().nextInt(900000));
        user.setVerificationCode(otp);
        user.setCodeExpiry(OffsetDateTime.now().plusMinutes(5));
        userRepository.save(user);

        emailService.sendOtpEmail(user.getEmail(), user.getFullName(), otp);
    }

    public void verifyOtpCode(VerifyOtpRequest req) {
        User user = userRepository.findByEmail(req.getEmail())
                .orElseThrow(() -> new NotFoundException("Không tìm thấy tài khoản"));

        if (user.getVerificationCode() == null || !user.getVerificationCode().equals(req.getCode())) {
            throw new BadRequestException("Mã xác minh không chính xác");
        }
        if (user.getCodeExpiry() == null || user.getCodeExpiry().isBefore(OffsetDateTime.now())) {
            throw new BadRequestException("Mã xác minh đã hết hạn, vui lòng gửi lại mã");
        }
    }

    public void resetPassword(ResetPasswordRequest req) {
        VerifyOtpRequest verifyRequest = new VerifyOtpRequest();
        verifyRequest.setEmail(req.getEmail());
        verifyRequest.setCode(req.getCode());
        verifyOtpCode(verifyRequest);

        User user = userRepository.findByEmail(req.getEmail())
                .orElseThrow(() -> new NotFoundException("Không tìm thấy tài khoản"));

        if (passwordEncoder.matches(req.getNewPassword(), user.getPasswordHash())) {
            throw new BadRequestException("Mật khẩu mới không được trùng mật khẩu hiện tại");
        }

        user.setPasswordHash(passwordEncoder.encode(req.getNewPassword()));
        user.setVerificationCode(null);
        user.setCodeExpiry(null);
        userRepository.save(user);
    }

    private AuthResponse toResponse(User user, String token) {
        return AuthResponse.builder()
                .accessToken(token)
                .tokenType("Bearer")
                .userId(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRoleName())
                .build();
    }
}