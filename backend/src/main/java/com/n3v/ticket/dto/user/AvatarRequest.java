package com.n3v.ticket.dto.user;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AvatarRequest {
    @NotBlank(message = "Avatar không được để trống")
    private String avatarUrl;
}