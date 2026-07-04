package com.n3v.ticket.dto.auth;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class RegisterRequest {
    @NotBlank(message = "Họ tên không được để trống")
    private String fullName;

    @NotBlank @Email(message = "Email không hợp lệ")
    private String email;

    @NotBlank(message = "Số điện thoại không được để trống")
    @Pattern(regexp = "^0\\d{9}$", message = "Số điện thoại phải đúng 10 số, bắt đầu bằng 0")
    private String phone;

    @NotBlank
    @Pattern(
            regexp = "^(?=.*[A-Za-z])(?=.*\\d)(?=.*[@$!%*#?&]).{8,}$",
            message = "Mật khẩu tối thiểu 8 ký tự, gồm chữ, số và ký tự đặc biệt"
    )
    private String password;
}