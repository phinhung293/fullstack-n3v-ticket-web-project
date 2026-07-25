package com.n3v.ticket.common.exception;

import com.n3v.ticket.common.ApiResponse;
import jakarta.validation.ConstraintViolationException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.LinkedHashMap;
import java.util.Map;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandle {
    // 1. Lỗi không tìm thấy
    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleNotFound(NotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error(404, ex.getMessage()));
    }

    // 2. Lỗi dữ liệu gửi lên sai định dạng, vi phạm ràng buộc
    @ExceptionHandler({BadRequestException.class, ConstraintViolationException.class})
    public ResponseEntity<ApiResponse<Void>> handleBadRequest(Exception ex) {
        return ResponseEntity.badRequest()
                .body(ApiResponse.error(400, ex.getMessage()));
    }

    // 3. Lỗi xung đột dữ liệu
    @ExceptionHandler(ConflictException.class)
    public ResponseEntity<ApiResponse<Void>> handleConflict(ConflictException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(ApiResponse.error(409, ex.getMessage()));
    }

    // 4. Bắt lỗi Bean Validation (@Email, @NotBlank...) từ các RequestBody gửi lên
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new LinkedHashMap<>();
        for (FieldError fieldError : ex.getBindingResult().getFieldErrors()) {
            errors.put(fieldError.getField(), fieldError.getDefaultMessage());
        }

        ApiResponse<Map<String, String>> response = new ApiResponse<>(
                400, false, "Validation failed", errors, java.time.LocalDateTime.now()
        );
        return ResponseEntity.badRequest().body(response);
    }

    // 5. Lỗi sai tài khoản hoặc mật khẩu khi đăng nhập (HTTP 401)
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiResponse<Void>> handleBadCredentials(BadCredentialsException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error(401, "Username or password is invalid"));
    }

    // 6. Lỗi không có quyền truy cập vào tính năng
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<Void>> handleAccessDenied(AccessDeniedException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.error(403, "Access denied"));
    }

    // 7. Lỗi ràng buộc dữ liệu tầng Database
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiResponse<Void>> handleDataIntegrityViolation(DataIntegrityViolationException ex) {
        return ResponseEntity.badRequest()
                .body(ApiResponse.error(400, "Data Integrity Violation. Please check duplicate or foreign key constraint violation"));
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ApiResponse<Void>> handleMissingRequestParameter(
            MissingServletRequestParameterException ex
    ) {
        String message;

        if ("from".equals(ex.getParameterName())) {
            message = "Thiếu tham số ngày bắt đầu: from";
        } else if ("to".equals(ex.getParameterName())) {
            message = "Thiếu tham số ngày kết thúc: to";
        } else {
            message = "Thiếu tham số bắt buộc: " + ex.getParameterName();
        }

        return ResponseEntity.badRequest()
                .body(ApiResponse.error(400, message));
    }

    // 8. Lỗi hệ thống chưa xác định
    // Không trả ex.getMessage() ra ngoài vì có thể lộ thông tin nội bộ
    // (tên bảng, câu query, đường dẫn...). Log đầy đủ ở server, trả message chung cho client.
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleUnknown(Exception ex) {
        log.error("Unhandled exception", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error(500, "Đã có lỗi xảy ra, vui lòng thử lại sau"));
    }
}
