package com.n3v.ticket.common;

import java.time.LocalDateTime;

public record ApiResponse<T>(
        int code,
        boolean success,
        String message,
        T data,
        LocalDateTime timestamp
) {

    public static <T> ApiResponse<T> success(String message, T data) {
        return new ApiResponse<>(200, true, message, data, LocalDateTime.now());
    }

    public static <T> ApiResponse<T> success(T data) {
        return success("Thực hiện thành công", data);
    }

    public static ApiResponse<Void> successMessage(String message) {
        return success(message, null);
    }

    public static <T> ApiResponse<T> error(int code, String message) {
        return new ApiResponse<>(code, false, message, null, LocalDateTime.now());
    }
}
