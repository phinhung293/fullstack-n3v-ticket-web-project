package com.n3v.ticket.controllers;

import com.n3v.ticket.common.ApiResponse;
import com.n3v.ticket.dto.event.EventZoneRequest;
import com.n3v.ticket.dto.event.EventZoneResponse;
import com.n3v.ticket.services.EventZoneService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Quan tri khu vuc/hang ve cua 1 su kien.
 * TODO: bao ve bang quyen ADMIN.
 */
@RestController
@RequestMapping("/api/admin/events/{eventId}/zones")
@RequiredArgsConstructor
public class EventZoneController {

    private final EventZoneService eventZoneService;

    @GetMapping
    public ApiResponse<List<EventZoneResponse>> getAll(@PathVariable Long eventId) {
        return ApiResponse.success(eventZoneService.getByEvent(eventId));
    }

    @GetMapping("/{zoneId}")
    public ApiResponse<EventZoneResponse> getById(@PathVariable Long eventId, @PathVariable Long zoneId) {
        return ApiResponse.success(eventZoneService.getById(eventId, zoneId));
    }

    @PostMapping
    public ApiResponse<EventZoneResponse> create(@PathVariable Long eventId,
                                                 @Valid @RequestBody EventZoneRequest request) {
        return ApiResponse.success("Tao khu vuc thanh cong", eventZoneService.create(eventId, request));
    }

    @PutMapping("/{zoneId}")
    public ApiResponse<EventZoneResponse> update(@PathVariable Long eventId, @PathVariable Long zoneId,
                                                 @Valid @RequestBody EventZoneRequest request) {
        return ApiResponse.success("Cap nhat khu vuc thanh cong", eventZoneService.update(eventId, zoneId, request));
    }

    @DeleteMapping("/{zoneId}")
    public ApiResponse<Void> delete(@PathVariable Long eventId, @PathVariable Long zoneId) {
        eventZoneService.delete(eventId, zoneId);
        return ApiResponse.successMessage("Xoa khu vuc thanh cong");
    }
}
