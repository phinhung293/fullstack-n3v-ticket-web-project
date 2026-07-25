package com.n3v.ticket.dto.event;

import com.n3v.ticket.enums.SeatTier;
import com.n3v.ticket.enums.SeatType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class EventSeatRequest {

    @NotNull(message = "Vui long chon loai ghe (SEAT/TABLE)")
    private SeatType seatType;

    @NotNull(message = "Vui long chon loai ve (VIP/STANDARD)")
    private SeatTier seatTier;

    private String seatRow;
    private Integer seatColumn;

    @NotBlank(message = "Ma ghe/ban khong duoc de trong")
    private String seatCode;

    private Integer capacity;
    private BigDecimal price;
}
