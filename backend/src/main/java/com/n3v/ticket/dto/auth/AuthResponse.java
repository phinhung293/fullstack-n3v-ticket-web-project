package com.n3v.ticket.dto.auth;

import lombok.*;

@Data @Builder
public class AuthResponse {
    private String accessToken;
    private String tokenType;
    private Long userId;
    private String fullName;
    private String email;
    private String role;
}