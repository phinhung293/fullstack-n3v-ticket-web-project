package com.n3v.ticket.controllers;

import com.n3v.ticket.common.ApiResponse;
import com.n3v.ticket.dto.event.*;
import com.n3v.ticket.enums.EventStatus;
import com.n3v.ticket.enums.TicketMapType;
import com.n3v.ticket.services.EventService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

/**
 * API quan tri su kien (ADMIN). Man hinh "tao su kien" o frontend admin se goi
 * POST /api/admin/events (tao DRAFT), sau do goi cac API cua EventZoneController /
 * EventSeatController de cau hinh so do ve, roi moi PATCH status sang PUBLISHED.
 *
 * TODO: bao ve toan bo controller nay bang quyen ADMIN (VD @PreAuthorize hoac
 * SecurityFilterChain rieng cho prefix "/api/admin/**") sau khi tich hop xong
 * Spring Security - tuong tu cach AdminController (module User) dang lam.
 */
@RestController
@RequestMapping("/api/admin/events")
@RequiredArgsConstructor
public class AdminEventController {

    private final EventService eventService;

    @GetMapping
    public ApiResponse<Page<EventSummaryResponse>> search(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) EventStatus status,
            @RequestParam(required = false) TicketMapType ticketMapType,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return ApiResponse.success(
                eventService.searchAdmin(keyword, categoryId, city, status, ticketMapType, from, to, pageable));
    }

    @GetMapping("/{id}")
    public ApiResponse<EventResponse> getById(@PathVariable Long id) {
        return ApiResponse.success(eventService.getById(id));
    }

    @PostMapping
    public ApiResponse<EventResponse> create(@Valid @RequestBody EventCreateRequest request) {
        return ApiResponse.success("Tao su kien thanh cong", eventService.create(request));
    }

    @PutMapping("/{id}")
    public ApiResponse<EventResponse> update(@PathVariable Long id, @Valid @RequestBody EventUpdateRequest request) {
        return ApiResponse.success("Cap nhat su kien thanh cong", eventService.update(id, request));
    }

    /**
     * Doi trang thai su kien theo state machine trong EventService
     * (VD: DRAFT -> PUBLISHED -> ONGOING -> COMPLETED, hoac -> CANCELLED).
     */
    @PatchMapping("/{id}/status")
    public ApiResponse<EventResponse> changeStatus(@PathVariable Long id,
                                                   @Valid @RequestBody EventStatusUpdateRequest request) {
        return ApiResponse.success("Cap nhat trang thai thanh cong", eventService.changeStatus(id, request.getStatus()));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        eventService.delete(id);
        return ApiResponse.successMessage("Xoa su kien thanh cong");
    }
}
