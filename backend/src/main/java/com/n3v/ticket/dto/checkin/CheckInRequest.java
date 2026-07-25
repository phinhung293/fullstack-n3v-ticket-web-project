package com.n3v.ticket.dto.checkin;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CheckInRequest {

    @NotNull(message = "Phải chọn sự kiện trước khi check-in")
    private Long eventId;

    @NotBlank(message = "Mã QR không được để trống")
    private String qrContent;
}
