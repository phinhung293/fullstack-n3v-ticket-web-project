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
import java.util.Locale;
import java.util.Random;

@Service
@RequiredArgsConstructor
public class AuthService {

    private static final String STATUS_ACTIVE = "ACTIVE";
    private static final String STATUS_LOCKED = "LOCKED";
    private static final String STATUS_PENDING_VERIFY = "PENDING_VERIFY";

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtils jwtUtils;
    private final EmailService emailService;

    public void register(RegisterRequest req) {
        String email = normalizeEmail(req.getEmail());
        String fullName = req.getFullName().trim();

        userRepository.findByEmail(email).ifPresent(existingUser -> {
            if (STATUS_PENDING_VERIFY.equals(existingUser.getStatus())) {
                existingUser.setFullName(fullName);
                existingUser.setPasswordHash(passwordEncoder.encode(req.getPassword()));
                generateAndSendRegisterOtp(existingUser);
                userRepository.save(existingUser);
                return;
            }

            throw new ConflictException("Email đã được sử dụng");
        });

        if (userRepository.existsByEmail(email)) {
            return;
        }

        Role userRole = roleRepository.findByName(Role.USER)
                .orElseThrow(() -> new NotFoundException("Chưa cấu hình vai trò " + Role.USER + " trong hệ thống"));

        User user = User.builder()
                .fullName(fullName)
                .email(email)
                .phone(null)
                .passwordHash(passwordEncoder.encode(req.getPassword()))
                .role(userRole)
                .status(STATUS_PENDING_VERIFY)
                .build();

        generateAndSendRegisterOtp(user);
        userRepository.save(user);
    }

    public AuthResponse verifyRegisterOtp(VerifyOtpRequest req) {
        User user = userRepository.findByEmail(normalizeEmail(req.getEmail()))
                .orElseThrow(() -> new NotFoundException("Không tìm thấy tài khoản"));

        if (STATUS_ACTIVE.equals(user.getStatus())) {
            throw new BadRequestException("Tài khoản này đã được xác thực");
        }

        if (STATUS_LOCKED.equals(user.getStatus())) {
            throw new BadRequestException("Tài khoản đã bị khóa");
        }

        if (!STATUS_PENDING_VERIFY.equals(user.getStatus())) {
            throw new BadRequestException("Trạng thái tài khoản không hợp lệ để xác thực");
        }

        validateOtp(user, req.getCode());

        user.setStatus(STATUS_ACTIVE);
        user.setVerificationCode(null);
        user.setCodeExpiry(null);
        userRepository.save(user);

        String token = jwtUtils.generateToken(user.getEmail(), user.getRoleName(), user.getId());
        return toResponse(user, token);
    }

    public AuthResponse login(LoginRequest req) {
        String email = normalizeEmail(req.getEmail());

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadRequestException("Email hoặc mật khẩu không đúng"));

        if (STATUS_PENDING_VERIFY.equals(user.getStatus())) {
            throw new BadRequestException("Tài khoản chưa xác thực email. Vui lòng nhập mã OTP đã gửi vào email.");
        }

        if (!STATUS_ACTIVE.equals(user.getStatus())) {
            throw new BadRequestException("Tài khoản đã bị khóa");
        }

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, req.getPassword())
        );

        String token = jwtUtils.generateToken(user.getEmail(), user.getRoleName(), user.getId());
        return toResponse(user, token);
    }

    // ============ QUÊN MẬT KHẨU ============

    public void sendResetCode(ForgotPasswordRequest req) {
        User user = userRepository.findByEmail(normalizeEmail(req.getEmail()))
                .orElseThrow(() -> new NotFoundException("Không tìm thấy tài khoản với email này"));

        String otp = generateOtp();
        user.setVerificationCode(otp);
        user.setCodeExpiry(OffsetDateTime.now().plusMinutes(5));
        userRepository.save(user);

        emailService.sendOtpEmail(user.getEmail(), user.getFullName(), otp);
    }

    public void verifyOtpCode(VerifyOtpRequest req) {
        User user = userRepository.findByEmail(normalizeEmail(req.getEmail()))
                .orElseThrow(() -> new NotFoundException("Không tìm thấy tài khoản"));

        validateOtp(user, req.getCode());
    }

    public void resetPassword(ResetPasswordRequest req) {
        VerifyOtpRequest verifyRequest = new VerifyOtpRequest();
        verifyRequest.setEmail(req.getEmail());
        verifyRequest.setCode(req.getCode());
        verifyOtpCode(verifyRequest);

        User user = userRepository.findByEmail(normalizeEmail(req.getEmail()))
                .orElseThrow(() -> new NotFoundException("Không tìm thấy tài khoản"));

        if (passwordEncoder.matches(req.getNewPassword(), user.getPasswordHash())) {
            throw new BadRequestException("Mật khẩu mới không được trùng mật khẩu hiện tại");
        }

        user.setPasswordHash(passwordEncoder.encode(req.getNewPassword()));
        user.setVerificationCode(null);
        user.setCodeExpiry(null);
        userRepository.save(user);
    }

    private void generateAndSendRegisterOtp(User user) {
        String otp = generateOtp();
        user.setVerificationCode(otp);
        user.setCodeExpiry(OffsetDateTime.now().plusMinutes(5));
        emailService.sendRegisterOtpEmail(user.getEmail(), user.getFullName(), otp);
    }

    private void validateOtp(User user, String code) {
        if (user.getVerificationCode() == null || !user.getVerificationCode().equals(code)) {
            throw new BadRequestException("Mã xác minh không chính xác");
        }

        if (user.getCodeExpiry() == null || user.getCodeExpiry().isBefore(OffsetDateTime.now())) {
            throw new BadRequestException("Mã xác minh đã hết hạn, vui lòng gửi lại mã");
        }
    }

    private String generateOtp() {
        return String.valueOf(100000 + new Random().nextInt(900000));
    }

    private String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase(Locale.ROOT);
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