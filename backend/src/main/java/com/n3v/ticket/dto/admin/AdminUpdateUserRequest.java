package com.n3v.ticket.dto.admin;

import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class AdminUpdateUserRequest {
    private String fullName;

    @Pattern(regexp = "^$|^0\\d{9}$", message = "Số điện thoại không hợp lệ")
    private String phone;

    private String role;

    private String status;
}