package com.n3v.ticket.controllers;

import com.n3v.ticket.common.ApiResponse;
import com.n3v.ticket.dto.event.EventResponse;
import com.n3v.ticket.dto.event.EventSummaryResponse;
import com.n3v.ticket.dto.event.EventZoneResponse;
import com.n3v.ticket.enums.TicketMapType;
import com.n3v.ticket.services.EventService;
import com.n3v.ticket.services.EventZoneService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

/**
 * API danh cho KHACH (khong can dang nhap):
 *  - Trang chu: GET /api/events (mac dinh chi tra ve PUBLISHED + ONGOING)
 *  - Thanh tim kiem/bo loc: cac query param cua GET /api/events
 *  - Trang chi tiet su kien: GET /api/events/{id}
 *  - Xem so do khu vuc de chon ve: GET /api/events/{id}/zones
 */
@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
public class PublicEventController {

    private final EventService eventService;
    private final EventZoneService eventZoneService;

    @GetMapping
    public ApiResponse<Page<EventSummaryResponse>> search(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) TicketMapType ticketMapType,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return ApiResponse.success(
                eventService.searchPublic(keyword, categoryId, city, ticketMapType, from, to, pageable));
    }

    @GetMapping("/{id}")
    public ApiResponse<EventResponse> getById(@PathVariable Long id) {
        return ApiResponse.success(eventService.getPublicById(id));
    }

    @GetMapping("/{id}/zones")
    public ApiResponse<List<EventZoneResponse>> getZones(@PathVariable Long id) {
        return ApiResponse.success(eventZoneService.getByEvent(id));
    }
}
