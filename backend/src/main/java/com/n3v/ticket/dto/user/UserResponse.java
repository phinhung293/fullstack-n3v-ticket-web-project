package com.n3v.ticket.dto.user;

import com.n3v.ticket.entities.User;
import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;

/**
 * Public-facing view of a User. Intentionally excludes passwordHash,
 * verificationCode and codeExpiry so they never leave the backend.
 */
@Data
@Builder
public class UserResponse {
    private Long id;
    private String email;
    private String fullName;
    private String phone;
    private String role;
    private String status;
    private String avatarUrl;
    private OffsetDateTime createdAt;

    public static UserResponse from(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .role(user.getRoleName())
                .status(user.getStatus())
                .avatarUrl(user.getAvatarUrl())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
