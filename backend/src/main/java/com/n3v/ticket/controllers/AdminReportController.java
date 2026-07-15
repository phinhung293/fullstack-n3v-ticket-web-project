package com.n3v.ticket.controllers;

import com.n3v.ticket.common.ApiResponse;
import com.n3v.ticket.dto.report.RevenueReportResponse;
import com.n3v.ticket.services.ReportExcelService;
import com.n3v.ticket.services.ReportService;
import com.n3v.ticket.services.ReportPdfService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/admin/reports")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminReportController {

    private final ReportService reportService;
    private final ReportExcelService reportExcelService;
    private final ReportPdfService reportPdfService;

    @GetMapping("/revenue")
    public ApiResponse<RevenueReportResponse> getRevenueReport(
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate from,

            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate to
    ) {
        return ApiResponse.success(
                "Lấy báo cáo doanh thu thành công",
                reportService.getRevenueReport(from, to)
        );
    }

    @GetMapping("/revenue/export/excel")
    public ResponseEntity<byte[]> exportRevenueExcel(
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate from,

            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate to
    ) {
        byte[] excelFile =
                reportExcelService.exportRevenueReport(from, to);

        String fileName = String.format(
                "bao-cao-doanh-thu_%s_%s.xlsx",
                from,
                to
        );

        return ResponseEntity.ok()
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + fileName + "\""
                )
                .contentType(
                        MediaType.parseMediaType(
                                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                        )
                )
                .contentLength(excelFile.length)
                .body(excelFile);
    }
    @GetMapping("/revenue/export/pdf")
    public ResponseEntity<byte[]> exportRevenuePdf(
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate from,

            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate to
    ) {
        byte[] pdfFile =
                reportPdfService.exportRevenueReport(from, to);

        String fileName = String.format(
                "bao-cao-doanh-thu_%s_%s.pdf",
                from,
                to
        );

        return ResponseEntity.ok()
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + fileName + "\""
                )
                .contentType(MediaType.APPLICATION_PDF)
                .contentLength(pdfFile.length)
                .body(pdfFile);
    }
}