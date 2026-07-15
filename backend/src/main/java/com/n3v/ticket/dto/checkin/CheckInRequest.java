package com.n3v.ticket.dto.checkin;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CheckInRequest {

    @NotBlank(message = "Mã QR không được để trống")
    private String qrContent;
}