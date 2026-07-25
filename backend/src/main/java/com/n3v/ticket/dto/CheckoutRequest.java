package com.n3v.ticket.dto;

import lombok.Data;
import java.util.List;

@Data
public class CheckoutRequest {
    private List<Long> seatIds;
    private List<ZoneSelection> zones;

    @Data
    public static class ZoneSelection {
        private Long zoneId;
        private Integer quantity;
    }
}
