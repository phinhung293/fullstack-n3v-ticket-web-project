package com.n3v.ticket.services;

import com.itextpdf.io.font.PdfEncodings;
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.font.PdfFont;
import com.itextpdf.kernel.font.PdfFontFactory;
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.borders.SolidBorder;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import com.n3v.ticket.dto.dashboard.RevenueChartResponse;
import com.n3v.ticket.dto.dashboard.TicketChartResponse;
import com.n3v.ticket.dto.report.RevenueReportResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ReportPdfService {

    private static final DateTimeFormatter DATE_FORMAT =
            DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private static final DeviceRgb NAVY =
            new DeviceRgb(11, 23, 54);

    private static final DeviceRgb PINK =
            new DeviceRgb(244, 63, 115);

    private static final DeviceRgb LIGHT_BLUE =
            new DeviceRgb(239, 246, 255);

    private static final DeviceRgb LIGHT_GREY =
            new DeviceRgb(248, 250, 252);

    private final ReportService reportService;

    public byte[] exportRevenueReport(
            LocalDate fromDate,
            LocalDate toDate
    ) {
        RevenueReportResponse report =
                reportService.getRevenueReport(fromDate, toDate);

        try (
                ByteArrayOutputStream outputStream =
                        new ByteArrayOutputStream()
        ) {
            PdfWriter writer = new PdfWriter(outputStream);
            PdfDocument pdfDocument = new PdfDocument(writer);

            Document document = new Document(
                    pdfDocument,
                    PageSize.A4.rotate()
            );

            document.setMargins(32, 32, 32, 32);

            PdfFont regularFont = createVietnameseFont(false);
            PdfFont boldFont = createVietnameseFont(true);

            addTitle(document, report, regularFont, boldFont);
            addSummary(document, report, regularFont, boldFont);
            addDailyTable(document, report, regularFont, boldFont);
            addFooter(document, regularFont);

            document.close();

            return outputStream.toByteArray();
        } catch (IOException exception) {
            throw new IllegalStateException(
                    "Không thể tạo file PDF báo cáo",
                    exception
            );
        }
    }

    private void addTitle(
            Document document,
            RevenueReportResponse report,
            PdfFont regularFont,
            PdfFont boldFont
    ) {
        Paragraph title = new Paragraph(
                "BÁO CÁO DOANH THU N3V TICKET"
        )
                .setFont(boldFont)
                .setFontSize(20)
                .setFontColor(ColorConstants.WHITE)
                .setTextAlignment(TextAlignment.CENTER)
                .setBackgroundColor(NAVY)
                .setPadding(12)
                .setMarginBottom(12);

        document.add(title);

        Paragraph period = new Paragraph()
                .setFont(regularFont)
                .setFontSize(11)
                .setFontColor(NAVY)
                .setTextAlignment(TextAlignment.CENTER)
                .add("Khoảng báo cáo: ")
                .add(
                        report.getFromDate().format(DATE_FORMAT)
                )
                .add(" đến ")
                .add(
                        report.getToDate().format(DATE_FORMAT)
                )
                .setMarginBottom(18);

        document.add(period);
    }

    private void addSummary(
            Document document,
            RevenueReportResponse report,
            PdfFont regularFont,
            PdfFont boldFont
    ) {
        Paragraph sectionTitle = new Paragraph("TỔNG HỢP")
                .setFont(boldFont)
                .setFontSize(13)
                .setFontColor(NAVY)
                .setMarginBottom(8);

        document.add(sectionTitle);

        Table summaryTable = new Table(
                UnitValue.createPercentArray(
                        new float[]{1, 1, 1, 1, 1}
                )
        );

        summaryTable.setWidth(UnitValue.createPercentValue(100));
        summaryTable.setMarginBottom(20);

        addSummaryCell(
                summaryTable,
                "Tổng doanh thu",
                formatCurrency(report.getTotalRevenue()),
                regularFont,
                boldFont
        );

        addSummaryCell(
                summaryTable,
                "Đơn thành công",
                formatNumber(report.getSuccessfulOrders()),
                regularFont,
                boldFont
        );

        addSummaryCell(
                summaryTable,
                "Vé phát hành",
                formatNumber(report.getTotalTickets()),
                regularFont,
                boldFont
        );

        addSummaryCell(
                summaryTable,
                "Vé check-in",
                formatNumber(report.getCheckedInTickets()),
                regularFont,
                boldFont
        );

        addSummaryCell(
                summaryTable,
                "Tỷ lệ check-in",
                formatPercent(report.getCheckInRate()),
                regularFont,
                boldFont
        );

        document.add(summaryTable);
    }

    private void addSummaryCell(
            Table table,
            String label,
            String value,
            PdfFont regularFont,
            PdfFont boldFont
    ) {
        Cell cell = new Cell()
                .setBackgroundColor(LIGHT_BLUE)
                .setBorder(new SolidBorder(
                        new DeviceRgb(219, 234, 254),
                        1
                ))
                .setPadding(10);

        cell.add(
                new Paragraph(label)
                        .setFont(regularFont)
                        .setFontSize(9)
                        .setFontColor(
                                new DeviceRgb(100, 116, 139)
                        )
        );

        cell.add(
                new Paragraph(value)
                        .setFont(boldFont)
                        .setFontSize(12)
                        .setFontColor(NAVY)
                        .setMarginTop(4)
        );

        table.addCell(cell);
    }

    private void addDailyTable(
            Document document,
            RevenueReportResponse report,
            PdfFont regularFont,
            PdfFont boldFont
    ) {
        Paragraph sectionTitle = new Paragraph(
                "CHI TIẾT THEO NGÀY"
        )
                .setFont(boldFont)
                .setFontSize(13)
                .setFontColor(NAVY)
                .setMarginBottom(8);

        document.add(sectionTitle);

        float[] columnWidths = {
                1.4f,
                2.1f,
                1.5f,
                1.8f,
                2.4f
        };

        Table table = new Table(
                UnitValue.createPercentArray(columnWidths)
        );

        table.setWidth(UnitValue.createPercentValue(100));

        addHeaderCell(table, "Ngày", boldFont);
        addHeaderCell(table, "Doanh thu", boldFont);
        addHeaderCell(table, "Số vé phát hành", boldFont);
        addHeaderCell(table, "Tỷ trọng doanh thu", boldFont);
        addHeaderCell(table, "Ghi chú", boldFont);

        Map<LocalDate, Long> ticketCountByDate =
                buildTicketCountMap(report);

        BigDecimal totalRevenue =
                report.getTotalRevenue() != null
                        ? report.getTotalRevenue()
                        : BigDecimal.ZERO;

        int rowIndex = 0;

        for (RevenueChartResponse revenueItem :
                report.getDailyRevenue()) {

            LocalDate date = revenueItem.getDate();

            BigDecimal revenue =
                    revenueItem.getRevenue() != null
                            ? revenueItem.getRevenue()
                            : BigDecimal.ZERO;

            long ticketCount =
                    ticketCountByDate.getOrDefault(date, 0L);

            double ratio =
                    totalRevenue.compareTo(BigDecimal.ZERO) == 0
                            ? 0.0
                            : revenue
                              .divide(
                                      totalRevenue,
                                      8,
                                      java.math.RoundingMode.HALF_UP
                              )
                              .doubleValue()
                              * 100.0;

            String note;

            if (revenue.compareTo(BigDecimal.ZERO) > 0
                    && ticketCount > 0) {
                note = "Có giao dịch";
            } else if (ticketCount > 0) {
                note = "Có vé, chưa ghi nhận doanh thu";
            } else {
                note = "Không phát sinh";
            }

            DeviceRgb rowBackground =
                    rowIndex % 2 == 0
                            ? new DeviceRgb(255, 255, 255)
                            : LIGHT_GREY;

            addDataCell(
                    table,
                    date.format(DATE_FORMAT),
                    regularFont,
                    rowBackground,
                    TextAlignment.CENTER
            );

            addDataCell(
                    table,
                    formatCurrency(revenue),
                    regularFont,
                    rowBackground,
                    TextAlignment.RIGHT
            );

            addDataCell(
                    table,
                    formatNumber(ticketCount),
                    regularFont,
                    rowBackground,
                    TextAlignment.CENTER
            );

            addDataCell(
                    table,
                    formatPercent(ratio),
                    regularFont,
                    rowBackground,
                    TextAlignment.CENTER
            );

            addDataCell(
                    table,
                    note,
                    regularFont,
                    rowBackground,
                    TextAlignment.LEFT
            );

            rowIndex++;
        }

        document.add(table);
    }

    private void addHeaderCell(
            Table table,
            String value,
            PdfFont boldFont
    ) {
        Cell cell = new Cell()
                .setBackgroundColor(NAVY)
                .setFontColor(ColorConstants.WHITE)
                .setPadding(8)
                .setTextAlignment(TextAlignment.CENTER)
                .setBorder(new SolidBorder(ColorConstants.WHITE, 0.5f));

        cell.add(
                new Paragraph(value)
                        .setFont(boldFont)
                        .setFontSize(9)
        );

        table.addHeaderCell(cell);
    }

    private void addDataCell(
            Table table,
            String value,
            PdfFont regularFont,
            DeviceRgb backgroundColor,
            TextAlignment alignment
    ) {
        Cell cell = new Cell()
                .setBackgroundColor(backgroundColor)
                .setPadding(7)
                .setTextAlignment(alignment)
                .setBorder(new SolidBorder(
                        new DeviceRgb(226, 232, 240),
                        0.7f
                ));

        cell.add(
                new Paragraph(value)
                        .setFont(regularFont)
                        .setFontSize(8.5f)
                        .setFontColor(NAVY)
        );

        table.addCell(cell);
    }

    private void addFooter(
            Document document,
            PdfFont regularFont
    ) {
        Paragraph footer = new Paragraph(
                "Báo cáo được tạo tự động bởi hệ thống N3V Ticket."
        )
                .setFont(regularFont)
                .setFontSize(8)
                .setFontColor(
                        new DeviceRgb(100, 116, 139)
                )
                .setTextAlignment(TextAlignment.RIGHT)
                .setMarginTop(12);

        document.add(footer);
    }

    private Map<LocalDate, Long> buildTicketCountMap(
            RevenueReportResponse report
    ) {
        Map<LocalDate, Long> result = new HashMap<>();

        for (TicketChartResponse item :
                report.getDailyTickets()) {

            result.put(
                    item.getDate(),
                    item.getTicketCount() != null
                            ? item.getTicketCount()
                            : 0L
            );
        }

        return result;
    }

    private PdfFont createVietnameseFont(boolean bold)
            throws IOException {

        String windowsFontPath = bold
                ? "C:/Windows/Fonts/arialbd.ttf"
                : "C:/Windows/Fonts/arial.ttf";

        return PdfFontFactory.createFont(
                windowsFontPath,
                PdfEncodings.IDENTITY_H,
                PdfFontFactory.EmbeddingStrategy.PREFER_EMBEDDED
        );
    }

    private String formatCurrency(BigDecimal value) {
        BigDecimal safeValue =
                value != null ? value : BigDecimal.ZERO;

        NumberFormat formatter =
                NumberFormat.getNumberInstance(
                        Locale.forLanguageTag("vi-VN")
                );

        formatter.setMaximumFractionDigits(0);

        return formatter.format(safeValue) + " ₫";
    }

    private String formatNumber(long value) {
        return NumberFormat
                .getNumberInstance(
                        Locale.forLanguageTag("vi-VN")
                )
                .format(value);
    }

    private String formatPercent(double value) {
        NumberFormat formatter =
                NumberFormat.getNumberInstance(
                        Locale.forLanguageTag("vi-VN")
                );

        formatter.setMinimumFractionDigits(0);
        formatter.setMaximumFractionDigits(2);

        return formatter.format(value) + "%";
    }
}