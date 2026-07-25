package com.n3v.ticket.services;

import com.n3v.ticket.dto.notification.CreateNotificationRequest;
import com.n3v.ticket.dto.report.RevenueReportResponse;
import com.n3v.ticket.entities.Event;
import com.n3v.ticket.entities.Role;
import com.n3v.ticket.entities.User;
import com.n3v.ticket.enums.EventStatus;
import com.n3v.ticket.enums.NotificationType;
import com.n3v.ticket.repositories.ETicketRepository;
import com.n3v.ticket.repositories.EventRepository;
import com.n3v.ticket.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationScheduler {

    private static final ZoneId VIETNAM_ZONE =
            ZoneId.of("Asia/Ho_Chi_Minh");

    private static final DateTimeFormatter EVENT_TIME_FORMATTER =
            DateTimeFormatter.ofPattern(
                    "HH:mm 'ngày' dd/MM/yyyy"
            );

    private static final DateTimeFormatter DATE_KEY_FORMATTER =
            DateTimeFormatter.BASIC_ISO_DATE;

    private static final List<EventStatus> REMINDER_STATUSES =
            List.of(
                    EventStatus.PUBLISHED,
                    EventStatus.ONGOING
            );

    private final EventRepository eventRepository;
    private final ETicketRepository eTicketRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final ReportService reportService;

    /**
     * Chạy mỗi phút để tìm sự kiện:
     * - còn khoảng 24 giờ;
     * - còn khoảng 2 giờ.
     *
     * Cửa sổ một phút + deduplicationKey bảo đảm
     * mỗi mốc chỉ tạo một thông báo.
     */
    @Scheduled(
            cron = "0 * * * * *",
            zone = "Asia/Ho_Chi_Minh"
    )
    @Transactional
    public void sendUpcomingEventReminders() {
        LocalDateTime now =
                LocalDateTime.now(VIETNAM_ZONE);

        sendRemindersForWindow(
                now.plusHours(24),
                now.plusHours(24).plusMinutes(1),
                "24H",
                "Sự kiện sẽ bắt đầu trong khoảng 24 giờ"
        );

        sendRemindersForWindow(
                now.plusHours(2),
                now.plusHours(2).plusMinutes(1),
                "2H",
                "Sự kiện sẽ bắt đầu trong khoảng 2 giờ"
        );
    }

    /**
     * Tổng kết ngày gửi lúc 23:55 giờ Việt Nam.
     */
    @Scheduled(
            cron = "0 55 23 * * *",
            zone = "Asia/Ho_Chi_Minh"
    )
    @Transactional
    public void sendAdminDailySummary() {
        LocalDate today =
                LocalDate.now(VIETNAM_ZONE);

        RevenueReportResponse report =
                reportService.getRevenueReport(
                        today,
                        today
                );

        List<User> admins =
                userRepository.findByRole_Name(
                        Role.ADMIN
                );

        String message =
                "Doanh thu: "
                        + formatCurrency(
                        report.getTotalRevenue()
                )
                        + " - Đơn thành công: "
                        + report.getSuccessfulOrders()
                        + " - Vé bán: "
                        + report.getTotalTickets()
                        + " - Vé đã check-in: "
                        + report.getCheckedInTickets()
                        + " - Tỷ lệ check-in: "
                        + report.getCheckInRate()
                        + "%.";

        for (User admin : admins) {
            notificationService.createNotification(
                    CreateNotificationRequest.builder()
                            .userId(admin.getId())
                            .type(
                                    NotificationType
                                            .ADMIN_DAILY_SUMMARY
                            )
                            .title(
                                    "Tổng kết ngày "
                                            + today.format(
                                            DateTimeFormatter
                                                    .ofPattern(
                                                            "dd/MM/yyyy"
                                                    )
                                    )
                            )
                            .message(message)
                            .targetUrl("/admin")
                            .referenceType("DAILY_REPORT")
                            .referenceId(null)
                            .deduplicationKey(
                                    "ADMIN_DAILY_SUMMARY_"
                                            + today.format(
                                            DATE_KEY_FORMATTER
                                    )
                                            + "_ADMIN_"
                                            + admin.getId()
                            )
                            .build()
            );
        }

        log.info(
                "Đã tạo tổng kết ngày {} cho {} admin",
                today,
                admins.size()
        );
    }

    private void sendRemindersForWindow(
            LocalDateTime fromTime,
            LocalDateTime toTime,
            String reminderCode,
            String title
    ) {
        List<Event> events =
                eventRepository
                        .findByStatusInAndStartTimeGreaterThanEqualAndStartTimeLessThan(
                                REMINDER_STATUSES,
                                fromTime,
                                toTime
                        );

        for (Event event : events) {
            List<User> recipients =
                    eTicketRepository
                            .findDistinctUsersByEventId(
                                    event.getId()
                            );

            for (User recipient : recipients) {
                notificationService.createNotification(
                        CreateNotificationRequest.builder()
                                .userId(recipient.getId())
                                .type(
                                        NotificationType.EVENT_REMINDER
                                )
                                .title(title)
                                .message(
                                        "Sự kiện "
                                                + event.getName()
                                                + " sẽ bắt đầu lúc "
                                                + event.getStartTime()
                                                .format(
                                                        EVENT_TIME_FORMATTER
                                                )
                                                + buildVenueText(event)
                                                + "."
                                )
                                .targetUrl(
                                        "/events/" + event.getId()
                                )
                                .referenceType("EVENT")
                                .referenceId(event.getId())
                                .deduplicationKey(
                                        "EVENT_REMINDER_"
                                                + reminderCode
                                                + "_EVENT_"
                                                + event.getId()
                                                + "_USER_"
                                                + recipient.getId()
                                )
                                .build()
                );
            }
        }
    }

    private String buildVenueText(Event event) {
        if (event.getVenueName() == null
                || event.getVenueName().isBlank()) {
            return "";
        }

        return " tại " + event.getVenueName().trim();
    }

    private String formatCurrency(BigDecimal amount) {
        NumberFormat currencyFormatter =
                NumberFormat.getCurrencyInstance(
                        Locale.of("vi", "VN")
                );

        return currencyFormatter.format(
                amount != null
                        ? amount
                        : BigDecimal.ZERO
        );
    }
}