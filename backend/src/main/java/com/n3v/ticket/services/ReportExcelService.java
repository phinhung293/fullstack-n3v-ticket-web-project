package com.n3v.ticket.services;

import com.n3v.ticket.dto.dashboard.RevenueChartResponse;
import com.n3v.ticket.dto.dashboard.TicketChartResponse;
import com.n3v.ticket.dto.report.RevenueReportResponse;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.BorderStyle;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.FillPatternType;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.HorizontalAlignment;
import org.apache.poi.ss.usermodel.IndexedColors;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.VerticalAlignment;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ReportExcelService {

    private static final DateTimeFormatter DISPLAY_DATE_FORMAT =
            DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final ReportService reportService;

    public byte[] exportRevenueReport(
            LocalDate fromDate,
            LocalDate toDate
    ) {
        RevenueReportResponse report =
                reportService.getRevenueReport(fromDate, toDate);

        try (
                Workbook workbook = new XSSFWorkbook();
                ByteArrayOutputStream outputStream =
                        new ByteArrayOutputStream()
        ) {
            Sheet sheet = workbook.createSheet("Báo cáo doanh thu");

            configureColumnWidths(sheet);

            CellStyle titleStyle = createTitleStyle(workbook);
            CellStyle sectionStyle = createSectionStyle(workbook);
            CellStyle labelStyle = createLabelStyle(workbook);
            CellStyle valueStyle = createValueStyle(workbook);
            CellStyle headerStyle = createHeaderStyle(workbook);
            CellStyle textCellStyle = createTextCellStyle(workbook);
            CellStyle numberCellStyle = createNumberCellStyle(workbook);
            CellStyle moneyCellStyle = createMoneyCellStyle(workbook);
            CellStyle percentCellStyle = createPercentCellStyle(workbook);

            int rowIndex = 0;

            rowIndex = createTitleSection(
                    sheet,
                    rowIndex,
                    report,
                    titleStyle,
                    labelStyle,
                    valueStyle
            );

            rowIndex++;

            rowIndex = createSummarySection(
                    sheet,
                    rowIndex,
                    report,
                    sectionStyle,
                    labelStyle,
                    valueStyle,
                    moneyCellStyle,
                    percentCellStyle
            );

            rowIndex += 2;

            createDailyDetailSection(
                    sheet,
                    rowIndex,
                    report,
                    sectionStyle,
                    headerStyle,
                    textCellStyle,
                    numberCellStyle,
                    moneyCellStyle,
                    percentCellStyle
            );

            sheet.createFreezePane(0, 12);

            workbook.write(outputStream);

            return outputStream.toByteArray();
        } catch (IOException exception) {
            throw new IllegalStateException(
                    "Không thể tạo file Excel báo cáo",
                    exception
            );
        }
    }

    private int createTitleSection(
            Sheet sheet,
            int rowIndex,
            RevenueReportResponse report,
            CellStyle titleStyle,
            CellStyle labelStyle,
            CellStyle valueStyle
    ) {
        Row titleRow = sheet.createRow(rowIndex++);
        titleRow.setHeightInPoints(32);

        Cell titleCell = titleRow.createCell(0);
        titleCell.setCellValue("BÁO CÁO DOANH THU N3V TICKET");
        titleCell.setCellStyle(titleStyle);

        sheet.addMergedRegion(
                new org.apache.poi.ss.util.CellRangeAddress(
                        titleRow.getRowNum(),
                        titleRow.getRowNum(),
                        0,
                        4
                )
        );

        Row fromRow = sheet.createRow(rowIndex++);
        createCell(fromRow, 0, "Từ ngày", labelStyle);
        createCell(
                fromRow,
                1,
                formatDate(report.getFromDate()),
                valueStyle
        );

        Row toRow = sheet.createRow(rowIndex++);
        createCell(toRow, 0, "Đến ngày", labelStyle);
        createCell(
                toRow,
                1,
                formatDate(report.getToDate()),
                valueStyle
        );

        return rowIndex;
    }

    private int createSummarySection(
            Sheet sheet,
            int rowIndex,
            RevenueReportResponse report,
            CellStyle sectionStyle,
            CellStyle labelStyle,
            CellStyle valueStyle,
            CellStyle moneyCellStyle,
            CellStyle percentCellStyle
    ) {
        Row sectionRow = sheet.createRow(rowIndex++);
        Cell sectionCell = sectionRow.createCell(0);
        sectionCell.setCellValue("TỔNG HỢP");
        sectionCell.setCellStyle(sectionStyle);

        sheet.addMergedRegion(
                new org.apache.poi.ss.util.CellRangeAddress(
                        sectionRow.getRowNum(),
                        sectionRow.getRowNum(),
                        0,
                        4
                )
        );

        Row revenueRow = sheet.createRow(rowIndex++);
        createCell(
                revenueRow,
                0,
                "Tổng doanh thu",
                labelStyle
        );

        Cell revenueCell = revenueRow.createCell(1);
        revenueCell.setCellValue(
                toDouble(report.getTotalRevenue())
        );
        revenueCell.setCellStyle(moneyCellStyle);

        Row orderRow = sheet.createRow(rowIndex++);
        createCell(
                orderRow,
                0,
                "Đơn thành công",
                labelStyle
        );
        createNumberCell(
                orderRow,
                1,
                report.getSuccessfulOrders(),
                valueStyle
        );

        Row ticketRow = sheet.createRow(rowIndex++);
        createCell(
                ticketRow,
                0,
                "Vé đã phát hành",
                labelStyle
        );
        createNumberCell(
                ticketRow,
                1,
                report.getTotalTickets(),
                valueStyle
        );

        Row checkedInRow = sheet.createRow(rowIndex++);
        createCell(
                checkedInRow,
                0,
                "Vé đã check-in",
                labelStyle
        );
        createNumberCell(
                checkedInRow,
                1,
                report.getCheckedInTickets(),
                valueStyle
        );

        Row rateRow = sheet.createRow(rowIndex++);
        createCell(
                rateRow,
                0,
                "Tỷ lệ check-in",
                labelStyle
        );

        Cell rateCell = rateRow.createCell(1);
        rateCell.setCellValue(report.getCheckInRate() / 100.0);
        rateCell.setCellStyle(percentCellStyle);

        return rowIndex;
    }

    private void createDailyDetailSection(
            Sheet sheet,
            int rowIndex,
            RevenueReportResponse report,
            CellStyle sectionStyle,
            CellStyle headerStyle,
            CellStyle textCellStyle,
            CellStyle numberCellStyle,
            CellStyle moneyCellStyle,
            CellStyle percentCellStyle
    ) {
        Row sectionRow = sheet.createRow(rowIndex++);
        Cell sectionCell = sectionRow.createCell(0);
        sectionCell.setCellValue("CHI TIẾT THEO NGÀY");
        sectionCell.setCellStyle(sectionStyle);

        sheet.addMergedRegion(
                new org.apache.poi.ss.util.CellRangeAddress(
                        sectionRow.getRowNum(),
                        sectionRow.getRowNum(),
                        0,
                        4
                )
        );

        Row headerRow = sheet.createRow(rowIndex++);
        headerRow.setHeightInPoints(24);

        String[] headers = {
                "Ngày",
                "Doanh thu",
                "Số vé phát hành",
                "Tỷ trọng doanh thu",
                "Ghi chú"
        };

        for (int columnIndex = 0;
             columnIndex < headers.length;
             columnIndex++) {
            createCell(
                    headerRow,
                    columnIndex,
                    headers[columnIndex],
                    headerStyle
            );
        }

        Map<LocalDate, Long> ticketCountByDate =
                buildTicketCountMap(report);

        BigDecimal totalRevenue = report.getTotalRevenue() != null
                ? report.getTotalRevenue()
                : BigDecimal.ZERO;

        for (RevenueChartResponse revenueItem :
                report.getDailyRevenue()) {
            Row dataRow = sheet.createRow(rowIndex++);

            LocalDate date = revenueItem.getDate();

            BigDecimal revenue =
                    revenueItem.getRevenue() != null
                            ? revenueItem.getRevenue()
                            : BigDecimal.ZERO;

            long ticketCount =
                    ticketCountByDate.getOrDefault(date, 0L);

            createCell(
                    dataRow,
                    0,
                    formatDate(date),
                    textCellStyle
            );

            Cell revenueCell = dataRow.createCell(1);
            revenueCell.setCellValue(toDouble(revenue));
            revenueCell.setCellStyle(moneyCellStyle);

            Cell ticketCell = dataRow.createCell(2);
            ticketCell.setCellValue(ticketCount);
            ticketCell.setCellStyle(numberCellStyle);

            Cell ratioCell = dataRow.createCell(3);

            double revenueRatio =
                    totalRevenue.compareTo(BigDecimal.ZERO) == 0
                            ? 0.0
                            : revenue
                              .divide(
                                      totalRevenue,
                                      8,
                                      java.math.RoundingMode.HALF_UP
                              )
                              .doubleValue();

            ratioCell.setCellValue(revenueRatio);
            ratioCell.setCellStyle(percentCellStyle);

            String note;

            if (revenue.compareTo(BigDecimal.ZERO) > 0
                    && ticketCount > 0) {
                note = "Có giao dịch";
            } else if (ticketCount > 0) {
                note = "Có vé, chưa ghi nhận doanh thu";
            } else {
                note = "Không phát sinh";
            }

            createCell(
                    dataRow,
                    4,
                    note,
                    textCellStyle
            );
        }
    }

    private Map<LocalDate, Long> buildTicketCountMap(
            RevenueReportResponse report
    ) {
        Map<LocalDate, Long> ticketCountByDate =
                new HashMap<>();

        for (TicketChartResponse item :
                report.getDailyTickets()) {
            ticketCountByDate.put(
                    item.getDate(),
                    item.getTicketCount() != null
                            ? item.getTicketCount()
                            : 0L
            );
        }

        return ticketCountByDate;
    }

    private void configureColumnWidths(Sheet sheet) {
        sheet.setColumnWidth(0, 16 * 256);
        sheet.setColumnWidth(1, 22 * 256);
        sheet.setColumnWidth(2, 20 * 256);
        sheet.setColumnWidth(3, 22 * 256);
        sheet.setColumnWidth(4, 30 * 256);
    }

    private CellStyle createTitleStyle(Workbook workbook) {
        Font font = workbook.createFont();
        font.setBold(true);
        font.setFontHeightInPoints((short) 18);
        font.setColor(IndexedColors.WHITE.getIndex());

        CellStyle style = workbook.createCellStyle();
        style.setFont(font);
        style.setFillForegroundColor(
                IndexedColors.DARK_BLUE.getIndex()
        );
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setVerticalAlignment(VerticalAlignment.CENTER);

        return style;
    }

    private CellStyle createSectionStyle(Workbook workbook) {
        Font font = workbook.createFont();
        font.setBold(true);
        font.setColor(IndexedColors.DARK_BLUE.getIndex());

        CellStyle style = workbook.createCellStyle();
        style.setFont(font);
        style.setFillForegroundColor(
                IndexedColors.LIGHT_CORNFLOWER_BLUE.getIndex()
        );
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setAlignment(HorizontalAlignment.LEFT);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        applyThinBorder(style);

        return style;
    }

    private CellStyle createLabelStyle(Workbook workbook) {
        Font font = workbook.createFont();
        font.setBold(true);

        CellStyle style = workbook.createCellStyle();
        style.setFont(font);
        style.setFillForegroundColor(
                IndexedColors.GREY_25_PERCENT.getIndex()
        );
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        applyThinBorder(style);

        return style;
    }

    private CellStyle createValueStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        applyThinBorder(style);

        return style;
    }

    private CellStyle createHeaderStyle(Workbook workbook) {
        Font font = workbook.createFont();
        font.setBold(true);
        font.setColor(IndexedColors.WHITE.getIndex());

        CellStyle style = workbook.createCellStyle();
        style.setFont(font);
        style.setFillForegroundColor(
                IndexedColors.DARK_BLUE.getIndex()
        );
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        applyThinBorder(style);

        return style;
    }

    private CellStyle createTextCellStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        applyThinBorder(style);

        return style;
    }

    private CellStyle createNumberCellStyle(
            Workbook workbook
    ) {
        CellStyle style = workbook.createCellStyle();
        style.setDataFormat(
                workbook.createDataFormat()
                        .getFormat("#,##0")
        );
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        applyThinBorder(style);

        return style;
    }

    private CellStyle createMoneyCellStyle(
            Workbook workbook
    ) {
        CellStyle style = workbook.createCellStyle();
        style.setDataFormat(
                workbook.createDataFormat()
                        .getFormat("#,##0 \"₫\"")
        );
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        applyThinBorder(style);

        return style;
    }

    private CellStyle createPercentCellStyle(
            Workbook workbook
    ) {
        CellStyle style = workbook.createCellStyle();
        style.setDataFormat(
                workbook.createDataFormat()
                        .getFormat("0.00%")
        );
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        applyThinBorder(style);

        return style;
    }

    private void applyThinBorder(CellStyle style) {
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
    }

    private void createCell(
            Row row,
            int columnIndex,
            String value,
            CellStyle style
    ) {
        Cell cell = row.createCell(columnIndex);
        cell.setCellValue(value);
        cell.setCellStyle(style);
    }

    private void createNumberCell(
            Row row,
            int columnIndex,
            long value,
            CellStyle style
    ) {
        Cell cell = row.createCell(columnIndex);
        cell.setCellValue(value);
        cell.setCellStyle(style);
    }

    private String formatDate(LocalDate value) {
        return value != null
                ? value.format(DISPLAY_DATE_FORMAT)
                : "";
    }

    private double toDouble(BigDecimal value) {
        return value != null
                ? value.doubleValue()
                : 0.0;
    }
}