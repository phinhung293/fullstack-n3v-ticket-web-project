package com.n3v.ticket.dto.event;

import com.n3v.ticket.enums.SeatStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class SeatStatusUpdateRequest {

    @NotNull(message = "Vui long chon trang thai moi cho ghe/ban")
    private SeatStatus status;
}
