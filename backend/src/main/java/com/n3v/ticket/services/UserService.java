package com.n3v.ticket.services;

import com.n3v.ticket.common.exception.BadRequestException;
import com.n3v.ticket.common.exception.NotFoundException;
import com.n3v.ticket.dto.admin.AdminUpdateUserRequest;
import com.n3v.ticket.dto.user.AvatarRequest;
import com.n3v.ticket.dto.user.ChangePasswordRequest;
import com.n3v.ticket.dto.user.UpdateProfileRequest;
import com.n3v.ticket.dto.user.UserResponse;
import com.n3v.ticket.entities.Role;
import com.n3v.ticket.entities.User;
import com.n3v.ticket.repositories.RoleRepository;
import com.n3v.ticket.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    private User findEntityByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy người dùng"));
    }

    private User findEntityById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy người dùng"));
    }

    public UserResponse getProfile(String email) {
        return UserResponse.from(findEntityByEmail(email));
    }

    public UserResponse updateProfile(String email, UpdateProfileRequest req) {
        User user = findEntityByEmail(email);

        if (req.getFullName() != null) {
            user.setFullName(req.getFullName());
        }

        if (req.getPhone() != null) {
            user.setPhone(req.getPhone());
        }

        return UserResponse.from(userRepository.save(user));
    }

    public void changePassword(String email, ChangePasswordRequest req) {
        User user = findEntityByEmail(email);

        if (!passwordEncoder.matches(req.getOldPassword(), user.getPasswordHash())) {
            throw new BadRequestException("Mật khẩu cũ không chính xác");
        }

        if (!req.getNewPassword().equals(req.getConfirmPassword())) {
            throw new BadRequestException("Mật khẩu xác nhận không khớp");
        }

        if (passwordEncoder.matches(req.getNewPassword(), user.getPasswordHash())) {
            throw new BadRequestException("Mật khẩu mới không được trùng mật khẩu cũ");
        }

        user.setPasswordHash(passwordEncoder.encode(req.getNewPassword()));
        userRepository.save(user);
    }

    public UserResponse updateAvatar(String email, AvatarRequest req) {
        User user = findEntityByEmail(email);
        user.setAvatarUrl(req.getAvatarUrl());

        return UserResponse.from(userRepository.save(user));
    }

    public List<UserResponse> getAllUsersForAdmin() {
        return userRepository.findAll()
                .stream()
                .map(UserResponse::from)
                .toList();
    }

    public UserResponse adminUpdateUser(Long id, AdminUpdateUserRequest req) {
        User user = findEntityById(id);

        if (req.getFullName() != null) {
            String fullName = req.getFullName().trim();

            if (fullName.isBlank()) {
                throw new BadRequestException("Họ và tên không được để trống");
            }

            user.setFullName(fullName);
        }

        if (req.getPhone() != null) {
            String phone = req.getPhone().trim();

            if (!phone.isBlank() && userRepository.existsByPhoneAndIdNot(phone, id)) {
                throw new BadRequestException("Số điện thoại đã được sử dụng");
            }

            user.setPhone(phone.isBlank() ? null : phone);
        }

        if (req.getRole() != null) {
            user.setRole(resolveRole(req.getRole()));
        }

        if (req.getStatus() != null) {
            user.setStatus(resolveStatus(req.getStatus()));
        }

        return UserResponse.from(userRepository.save(user));
    }

    public void adminDeleteUser(Long id, String currentAdminEmail) {
        User user = findEntityById(id);

        String roleName = user.getRole() == null ? "" : user.getRole().getName();

        boolean isAdminAccount = roleName.equalsIgnoreCase("ADMIN")
                || roleName.equalsIgnoreCase("ROLE_ADMIN")
                || roleName.equalsIgnoreCase(Role.ADMIN);

        if (isAdminAccount) {
            throw new BadRequestException("Không được xóa tài khoản ADMIN");
        }

        if (user.getEmail().equalsIgnoreCase(currentAdminEmail)) {
            throw new BadRequestException("Không thể xóa chính tài khoản đang đăng nhập");
        }

        userRepository.delete(user);
    }

    private Role resolveRole(String input) {
        String roleName = input.trim().toUpperCase();

        if (roleName.equals("ADMIN")) {
            roleName = Role.ADMIN;
        } else if (roleName.equals("CUSTOMER") || roleName.equals("USER")) {
            roleName = Role.USER;
        }

        if (!roleName.equals(Role.ADMIN) && !roleName.equals(Role.USER)) {
            throw new BadRequestException("Quyền không hợp lệ");
        }

        String finalRoleName = roleName;

        return roleRepository.findByName(finalRoleName)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy quyền " + finalRoleName));
    }

    private String resolveStatus(String input) {
        String status = input.trim().toUpperCase();

        if (!status.equals("ACTIVE") && !status.equals("LOCKED")) {
            throw new BadRequestException("Trạng thái không hợp lệ");
        }

        return status;
    }
}
