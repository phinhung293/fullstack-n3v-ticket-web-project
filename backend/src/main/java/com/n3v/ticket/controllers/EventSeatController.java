package com.n3v.ticket.controllers;

import com.n3v.ticket.common.ApiResponse;
import com.n3v.ticket.dto.event.EventSeatRequest;
import com.n3v.ticket.dto.event.EventSeatResponse;
import com.n3v.ticket.dto.event.SeatBulkGenerateRequest;
import com.n3v.ticket.services.EventSeatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Quan tri tung ghe/ban ben trong 1 zone.
 * - POST /bulk-generate: dung cho man hinh admin "sinh nhanh so do ghe" (VD nhap
 *   hang A-E, 10 cot/hang -> tu dong tao 50 ghe), tranh phai them tay tung ghe.
 * TODO: bao ve bang quyen ADMIN.
 */
@RestController
@RequestMapping("/api/admin/zones/{zoneId}/seats")
@RequiredArgsConstructor
public class EventSeatController {

    private final EventSeatService eventSeatService;

    @GetMapping
    public ApiResponse<List<EventSeatResponse>> getAll(@PathVariable Long zoneId) {
        return ApiResponse.success(eventSeatService.getByZone(zoneId));
    }

    @PostMapping
    public ApiResponse<EventSeatResponse> create(@PathVariable Long zoneId,
                                                 @Valid @RequestBody EventSeatRequest request) {
        return ApiResponse.success("Tao ghe/ban thanh cong", eventSeatService.create(zoneId, request));
    }

    @PostMapping("/bulk-generate")
    public ApiResponse<List<EventSeatResponse>> bulkGenerate(@PathVariable Long zoneId,
                                                             @Valid @RequestBody SeatBulkGenerateRequest request) {
        return ApiResponse.success("Sinh so do ghe thanh cong", eventSeatService.bulkGenerate(zoneId, request));
    }

    @PutMapping("/{seatId}")
    public ApiResponse<EventSeatResponse> update(@PathVariable Long zoneId, @PathVariable Long seatId,
                                                 @Valid @RequestBody EventSeatRequest request) {
        return ApiResponse.success("Cap nhat ghe/ban thanh cong", eventSeatService.update(zoneId, seatId, request));
    }

    @DeleteMapping("/{seatId}")
    public ApiResponse<Void> delete(@PathVariable Long zoneId, @PathVariable Long seatId) {
        eventSeatService.delete(zoneId, seatId);
        return ApiResponse.successMessage("Xoa ghe/ban thanh cong");
    }
}
