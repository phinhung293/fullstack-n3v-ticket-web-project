package com.n3v.ticket.dto.event;

import com.n3v.ticket.entities.EventSeat;
import com.n3v.ticket.enums.SeatStatus;
import com.n3v.ticket.enums.SeatTier;
import com.n3v.ticket.enums.SeatType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EventSeatResponse {
    private Long id;
    private Long zoneId;
    private SeatType seatType;
    private SeatTier seatTier;
    private String seatRow;
    private Integer seatColumn;
    private String seatCode;
    private Integer capacity;
    private BigDecimal price;
    private SeatStatus status;

    public static EventSeatResponse from(EventSeat seat) {
        if (seat == null) return null;
        return EventSeatResponse.builder()
                .id(seat.getId())
                .zoneId(seat.getEventZone().getId())
                .seatType(seat.getSeatType())
                .seatTier(seat.getSeatTier())
                .seatRow(seat.getSeatRow())
                .seatColumn(seat.getSeatColumn())
                .seatCode(seat.getSeatCode())
                .capacity(seat.getCapacity())
                .price(seat.getPrice())
                .status(seat.getStatus())
                .build();
    }
}
