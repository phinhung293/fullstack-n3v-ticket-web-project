package com.n3v.ticket.controllers;

import com.n3v.ticket.common.ApiResponse;
import com.n3v.ticket.dto.event.EventSeatResponse;
import com.n3v.ticket.services.EventSeatService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Cho khach xem so do ghe/ban cua 1 zone khi chon ve (TicketMapType SEAT_MAP / TEA_LOUNGE).
 * Module Dat ve & thanh toan se dung API nay lam nen de ve so do tuong tac,
 * roi tu quan ly rieng viec LOCKED/SOLD qua API cua module do.
 */
@RestController
@RequestMapping("/api/zones/{zoneId}/seats")
@RequiredArgsConstructor
public class PublicSeatController {

    private final EventSeatService eventSeatService;

    @GetMapping
    public ApiResponse<List<EventSeatResponse>> getSeatMap(@PathVariable Long zoneId) {
        return ApiResponse.success(eventSeatService.getByZone(zoneId));
    }
}
