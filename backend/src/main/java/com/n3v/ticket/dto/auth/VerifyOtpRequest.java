package com.n3v.ticket.dto.auth;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class VerifyOtpRequest {
    @NotBlank @Email
    private String email;

    @NotBlank
    private String code;
}