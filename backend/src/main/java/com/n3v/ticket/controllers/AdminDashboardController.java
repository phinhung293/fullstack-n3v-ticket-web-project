package com.n3v.ticket.controllers;

import com.n3v.ticket.common.ApiResponse;
import com.n3v.ticket.dto.dashboard.DashboardSummaryResponse;
import com.n3v.ticket.dto.dashboard.RevenueChartResponse;
import com.n3v.ticket.dto.dashboard.TicketChartResponse;
import com.n3v.ticket.services.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import com.n3v.ticket.services.ReportExcelService;


import java.util.List;

@RestController
@RequestMapping("/api/admin/dashboard")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminDashboardController {

    private final DashboardService dashboardService;
    private final ReportExcelService reportExcelService;

    @GetMapping("/summary")
    public ApiResponse<DashboardSummaryResponse> getSummary() {
        return ApiResponse.success(
                "Lấy số liệu Dashboard thành công",
                dashboardService.getSummary()
        );
    }

    @GetMapping("/revenue")
    public ApiResponse<List<RevenueChartResponse>> getDailyRevenue(
            @RequestParam(defaultValue = "7") int days
    ) {
        return ApiResponse.success(
                "Lấy dữ liệu doanh thu theo ngày thành công",
                dashboardService.getDailyRevenue(days)
        );
    }

    @GetMapping("/tickets")
    public ApiResponse<List<TicketChartResponse>> getDailyTicketCount(
            @RequestParam(defaultValue = "7") int days
    ) {
        return ApiResponse.success(
                "Lấy dữ liệu số vé theo ngày thành công",
                dashboardService.getDailyTicketCount(days)
        );
    }
}