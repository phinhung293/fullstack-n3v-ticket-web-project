package com.n3v.ticket.services;

import com.n3v.ticket.dto.checkin.CheckInEventResponse;
import com.n3v.ticket.dto.checkin.CheckInResponse;
import com.n3v.ticket.entities.ETicket;
import com.n3v.ticket.entities.Event;
import com.n3v.ticket.entities.EventSeat;
import com.n3v.ticket.entities.EventZone;
import com.n3v.ticket.entities.Order;
import com.n3v.ticket.entities.OrderItem;
import com.n3v.ticket.entities.Payment;
import com.n3v.ticket.entities.User;
import com.n3v.ticket.enums.CheckInWindowStatus;
import com.n3v.ticket.enums.EventStatus;
import com.n3v.ticket.enums.NotificationType;
import com.n3v.ticket.enums.OrderStatus;
import com.n3v.ticket.enums.TicketStatus;
import com.n3v.ticket.repositories.ETicketRepository;
import com.n3v.ticket.repositories.EventRepository;
import com.n3v.ticket.repositories.PaymentRepository;
import com.n3v.ticket.common.TicketQrPayload;
import com.n3v.ticket.common.exception.BadRequestException;
import com.n3v.ticket.common.exception.NotFoundException;
import com.n3v.ticket.dto.notification.CreateNotificationRequest;
import org.springframework.security.access.AccessDeniedException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.n3v.ticket.dto.ticket.TicketResponse;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TicketService {

    private static final ZoneId VIETNAM_ZONE =
            ZoneId.of("Asia/Ho_Chi_Minh");

    private static final long CHECK_IN_OPEN_MINUTES_BEFORE = 60;

    private static final DateTimeFormatter CHECK_IN_TIME_FORMATTER =
            DateTimeFormatter.ofPattern("HH:mm 'ngày' dd/MM/yyyy");

    private static final List<EventStatus> CHECK_IN_EVENT_STATUSES =
            List.of(EventStatus.PUBLISHED, EventStatus.ONGOING);

    private final ETicketRepository eTicketRepository;
    private final EventRepository eventRepository;
    private final PaymentRepository paymentRepository;

    private final SecureRandom secureRandom = new SecureRandom();

    private final QrCodeService qrCodeService;
    private final NotificationService notificationService;

    /**
     * Sinh vé điện tử cho toàn bộ OrderItem của đơn hàng đã thanh toán.
     *
     * Vé theo ghế:
     * - Mỗi OrderItem tương ứng một ghế và tạo một vé.
     *
     * Vé theo khu vực:
     * - Số vé được tạo bằng OrderItem.quantity.
     */
    @Transactional
    public void issueTicketsForOrder(
            Order order,
            List<OrderItem> orderItems
    ) {
        for (OrderItem orderItem : orderItems) {
            if (eTicketRepository.existsByOrderItemId(orderItem.getId())) {
                continue;
            }

            int quantity = resolveTicketQuantity(orderItem);

            for (int index = 0; index < quantity; index++) {
                EventZone eventZone = resolveEventZone(orderItem);
                Event event = resolveEvent(orderItem);
                EventSeat seat = orderItem.getSeat();

                ETicket ticket = ETicket.builder()
                        .ticketCode(generateUniqueTicketCode())
                        .orderItem(orderItem)
                        .user(order.getUser())
                        .event(event)
                        .eventZone(eventZone)
                        .seat(seat)
                        .qrCodeHash(generateUniqueQrToken())
                        .status(TicketStatus.ISSUED)
                        .build();

                eTicketRepository.save(ticket);
            }
        }
    }

    private int resolveTicketQuantity(OrderItem orderItem) {
        if (orderItem.getSeat() != null) {
            return 1;
        }

        Integer quantity = orderItem.getQuantity();

        if (quantity == null || quantity <= 0) {
            return 1;
        }

        return quantity;
    }

    private EventZone resolveEventZone(OrderItem orderItem) {
        if (orderItem.getEventZone() != null) {
            return orderItem.getEventZone();
        }

        if (orderItem.getSeat() != null) {
            return orderItem.getSeat().getEventZone();
        }

        throw new IllegalStateException(
                "OrderItem không có khu vực hoặc ghế"
        );
    }

    private Event resolveEvent(OrderItem orderItem) {
        EventZone eventZone = resolveEventZone(orderItem);

        if (eventZone.getEvent() == null) {
            throw new IllegalStateException(
                    "Khu vực chưa được liên kết với sự kiện"
            );
        }

        return eventZone.getEvent();
    }

    private String generateUniqueTicketCode() {
        String ticketCode;

        do {
            String randomPart = UUID.randomUUID()
                    .toString()
                    .replace("-", "")
                    .substring(0, 10)
                    .toUpperCase();

            ticketCode = "N3V-" + randomPart;
        } while (eTicketRepository.findByTicketCode(ticketCode).isPresent());

        return ticketCode;
    }

    private String generateUniqueQrToken() {
        String qrToken;

        do {
            byte[] tokenBytes = new byte[32];
            secureRandom.nextBytes(tokenBytes);
            qrToken = HexFormat.of().formatHex(tokenBytes);
        } while (eTicketRepository.findByQrCodeHash(qrToken).isPresent());

        return qrToken;
    }

    @Transactional(readOnly = true)
    public List<TicketResponse> getMyTickets(User user) {
        return eTicketRepository
                .findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(this::mapToTicketResponse)
                .toList();
    }

    /**
     * Hiển thị các sự kiện còn hoạt động của hôm nay và ngày mai.
     * Admin có thể mở trước màn hình sự kiện để chuẩn bị thiết bị,
     * nhưng máy quét chỉ hoạt động khi checkInStatus = OPEN.
     */
    @Transactional(readOnly = true)
    public List<CheckInEventResponse> getEventsAvailableForCheckIn() {
        LocalDateTime now = LocalDateTime.now(VIETNAM_ZONE);
        LocalDateTime visibleUntil = now
                .toLocalDate()
                .plusDays(2)
                .atStartOfDay();

        return eventRepository
                .findEventsAvailableForCheckIn(
                        CHECK_IN_EVENT_STATUSES,
                        now,
                        visibleUntil
                )
                .stream()
                .map(event -> mapToCheckInEventResponse(event, now))
                .toList();
    }

    private CheckInEventResponse mapToCheckInEventResponse(
            Event event,
            LocalDateTime now
    ) {
        LocalDateTime checkInOpenAt = resolveCheckInOpenAt(event);
        LocalDateTime checkInCloseAt = resolveCheckInCloseAt(event);
        CheckInWindowStatus windowStatus = resolveCheckInWindowStatus(
                event,
                now
        );

        long totalTickets = eTicketRepository
                .countByEventIdAndStatusIn(
                        event.getId(),
                        List.of(
                                TicketStatus.ISSUED,
                                TicketStatus.CHECKED_IN
                        )
                );

        long checkedInTickets = eTicketRepository
                .countByEventIdAndStatus(
                        event.getId(),
                        TicketStatus.CHECKED_IN
                );

        return CheckInEventResponse.builder()
                .id(event.getId())
                .name(event.getName())
                .thumbnailUrl(event.getThumbnailUrl())
                .venueName(event.getVenueName())
                .address(event.getAddress())
                .startTime(event.getStartTime())
                .endTime(event.getEndTime())
                .checkInOpenAt(checkInOpenAt)
                .checkInCloseAt(checkInCloseAt)
                .eventStatus(event.getStatus().name())
                .checkInStatus(windowStatus.name())
                .totalTickets(totalTickets)
                .checkedInTickets(checkedInTickets)
                .remainingTickets(
                        Math.max(0, totalTickets - checkedInTickets)
                )
                .build();
    }

    private TicketResponse mapToTicketResponse(ETicket ticket) {
        Event event = ticket.getEvent();
        EventZone eventZone = ticket.getEventZone();
        EventSeat seat = ticket.getSeat();

        return TicketResponse.builder()
                .id(ticket.getId())
                .ticketCode(ticket.getTicketCode())
                .status(ticket.getStatus().name())

                .eventName(event != null ? event.getName() : null)
                .eventThumbnail(
                        event != null ? event.getThumbnailUrl() : null
                )
                .venueName(
                        event != null ? event.getVenueName() : null
                )
                .address(
                        event != null ? event.getAddress() : null
                )
                .eventStartTime(
                        event != null ? event.getStartTime() : null
                )

                .zoneName(
                        eventZone != null ? eventZone.getZoneName() : null
                )
                .seatCode(
                        seat != null ? seat.getSeatCode() : null
                )

                .checkedInAt(ticket.getCheckedInAt())
                .createdAt(ticket.getCreatedAt())
                .build();
    }

    @Transactional(readOnly = true)
    public byte[] generateQrForUser(
            Long ticketId,
            String userEmail
    ) {
        ETicket ticket = eTicketRepository.findById(ticketId)
                .orElseThrow(() ->
                        new NotFoundException("Không tìm thấy vé")
                );

        if (userEmail == null
                || userEmail.isBlank()
                || ticket.getUser() == null
                || ticket.getUser().getEmail() == null
                || !ticket.getUser()
                .getEmail()
                .equalsIgnoreCase(userEmail)) {

            throw new AccessDeniedException(
                    "Bạn không có quyền xem mã QR của vé này"
            );
        }

        String qrContent = TicketQrPayload.fromToken(
                ticket.getQrCodeHash()
        );

        return qrCodeService.generatePng(
                qrContent,
                500,
                500
        );
    }

    @Transactional
    public CheckInResponse checkInTicket(
            Long selectedEventId,
            String qrContent,
            User checkedInBy
    ) {
        if (selectedEventId == null || selectedEventId <= 0) {
            throw new BadRequestException(
                    "Phải chọn sự kiện trước khi check-in"
            );
        }

        Event selectedEvent = eventRepository
                .findById(selectedEventId)
                .orElseThrow(() ->
                        new NotFoundException(
                                "Không tìm thấy sự kiện check-in"
                        )
                );

        LocalDateTime nowInVietnam =
                LocalDateTime.now(VIETNAM_ZONE);

        validateEventForCheckIn(selectedEvent, nowInVietnam);

        String qrToken = extractQrToken(qrContent);

        ETicket ticket = eTicketRepository
                .findByQrCodeHashForUpdate(qrToken)
                .orElseThrow(() ->
                        new BadRequestException("Mã QR không hợp lệ")
                );

        validateTicketBelongsToSelectedEvent(
                ticket,
                selectedEventId
        );

        validateTicketPayment(ticket);

        if (ticket.getStatus() == TicketStatus.CHECKED_IN) {
            return CheckInResponse.builder()
                    .success(false)
                    .message("Vé đã được check-in trước đó")
                    .ticketCode(ticket.getTicketCode())
                    .ticketStatus(ticket.getStatus().name())
                    .eventId(selectedEventId)
                    .customerName(
                            ticket.getUser() != null
                                    ? ticket.getUser().getFullName()
                                    : null
                    )
                    .eventName(
                            ticket.getEvent() != null
                                    ? ticket.getEvent().getName()
                                    : null
                    )
                    .zoneName(
                            ticket.getEventZone() != null
                                    ? ticket.getEventZone().getZoneName()
                                    : null
                    )
                    .seatCode(
                            ticket.getSeat() != null
                                    ? ticket.getSeat().getSeatCode()
                                    : null
                    )
                    .checkedInAt(ticket.getCheckedInAt())
                    .checkedInByName(
                            ticket.getCheckedInBy() != null
                                    ? ticket.getCheckedInBy().getFullName()
                                    : null
                    )
                    .build();
        }

        if (ticket.getStatus() != TicketStatus.ISSUED) {
            return CheckInResponse.builder()
                    .success(false)
                    .message("Vé không còn hiệu lực")
                    .ticketCode(ticket.getTicketCode())
                    .ticketStatus(ticket.getStatus().name())
                    .eventId(selectedEventId)
                    .build();
        }

        OffsetDateTime now = OffsetDateTime.now(VIETNAM_ZONE);

        ticket.setStatus(TicketStatus.CHECKED_IN);
        ticket.setCheckedInAt(now);
        ticket.setCheckedInBy(checkedInBy);

        eTicketRepository.save(ticket);

        notifyTicketCheckedIn(ticket);

        return CheckInResponse.builder()
                .success(true)
                .message("Check-in thành công")
                .ticketCode(ticket.getTicketCode())
                .ticketStatus(ticket.getStatus().name())
                .eventId(selectedEventId)
                .customerName(
                        ticket.getUser() != null
                                ? ticket.getUser().getFullName()
                                : null
                )
                .eventName(
                        ticket.getEvent() != null
                                ? ticket.getEvent().getName()
                                : null
                )
                .zoneName(
                        ticket.getEventZone() != null
                                ? ticket.getEventZone().getZoneName()
                                : null
                )
                .seatCode(
                        ticket.getSeat() != null
                                ? ticket.getSeat().getSeatCode()
                                : null
                )
                .checkedInAt(now)
                .checkedInByName(checkedInBy.getFullName())
                .build();
    }

    private void notifyTicketCheckedIn(ETicket ticket) {
        if (ticket == null || ticket.getUser() == null) {
            return;
        }

        User ticketOwner = ticket.getUser();

        String eventName = ticket.getEvent() != null
                ? ticket.getEvent().getName()
                : "sự kiện";

        /*
         * Thông báo cho chủ vé.
         */
        notificationService.createNotification(
                CreateNotificationRequest.builder()
                        .userId(ticketOwner.getId())
                        .type(NotificationType.TICKET_CHECKED_IN)
                        .title("Vé đã được check-in")
                        .message(
                                "Vé "
                                        + ticket.getTicketCode()
                                        + " của sự kiện "
                                        + eventName
                                        + " đã được check-in thành công."
                        )
                        .targetUrl("/my-tickets")
                        .referenceType("TICKET")
                        .referenceId(ticket.getId())
                        .deduplicationKey(
                                "TICKET_CHECKED_IN_"
                                        + ticket.getId()
                                        + "_USER_"
                                        + ticketOwner.getId()
                        )
                        .build()
        );

    }

    private void validateEventForCheckIn(
            Event event,
            LocalDateTime now
    ) {
        if (event == null) {
            throw new BadRequestException(
                    "Không tìm thấy sự kiện check-in"
            );
        }

        if (event.getStatus() == EventStatus.CANCELLED) {
            throw new BadRequestException(
                    "Không thể check-in vì sự kiện đã bị hủy"
            );
        }

        if (event.getStatus() == EventStatus.COMPLETED) {
            throw new BadRequestException(
                    "Không thể check-in vì sự kiện đã kết thúc"
            );
        }

        if (event.getStatus() == EventStatus.DRAFT) {
            throw new BadRequestException(
                    "Không thể check-in cho sự kiện chưa được công bố"
            );
        }

        if (event.getStartTime() == null || event.getEndTime() == null) {
            throw new BadRequestException(
                    "Sự kiện chưa có thời gian bắt đầu hoặc kết thúc hợp lệ"
            );
        }

        CheckInWindowStatus windowStatus =
                resolveCheckInWindowStatus(event, now);

        if (windowStatus == CheckInWindowStatus.NOT_OPEN) {
            throw new BadRequestException(
                    "Check-in chưa mở. Hệ thống sẽ mở lúc "
                            + resolveCheckInOpenAt(event)
                            .format(CHECK_IN_TIME_FORMATTER)
                            + " (trước sự kiện 60 phút)"
            );
        }

        if (windowStatus == CheckInWindowStatus.CLOSED) {
            throw new BadRequestException(
                    "Check-in đã đóng vì sự kiện đã kết thúc"
            );
        }
    }

    private void validateTicketBelongsToSelectedEvent(
            ETicket ticket,
            Long selectedEventId
    ) {
        if (ticket.getEvent() == null) {
            throw new BadRequestException(
                    "Vé chưa được liên kết với sự kiện"
            );
        }

        if (!selectedEventId.equals(ticket.getEvent().getId())) {
            throw new BadRequestException(
                    "Vé không thuộc sự kiện đang được chọn"
            );
        }
    }

    private void validateTicketPayment(ETicket ticket) {
        OrderItem orderItem = ticket.getOrderItem();
        Order order = orderItem != null ? orderItem.getOrder() : null;

        if (order == null || order.getStatus() != OrderStatus.SUCCESS) {
            throw new BadRequestException(
                    "Vé không thuộc đơn hàng đã hoàn tất"
            );
        }

        Payment payment = paymentRepository
                .findByOrderId(order.getId())
                .orElseThrow(() ->
                        new BadRequestException(
                                "Không tìm thấy thanh toán của vé"
                        )
                );

        if (!"PAID".equals(payment.getStatus())) {
            throw new BadRequestException(
                    "Vé chưa được xác nhận thanh toán"
            );
        }
    }

    private LocalDateTime resolveCheckInOpenAt(Event event) {
        return event.getStartTime()
                .minusMinutes(CHECK_IN_OPEN_MINUTES_BEFORE);
    }

    private LocalDateTime resolveCheckInCloseAt(Event event) {
        return event.getEndTime();
    }

    private CheckInWindowStatus resolveCheckInWindowStatus(
            Event event,
            LocalDateTime now
    ) {
        LocalDateTime openAt = resolveCheckInOpenAt(event);
        LocalDateTime closeAt = resolveCheckInCloseAt(event);

        if (now.isBefore(openAt)) {
            return CheckInWindowStatus.NOT_OPEN;
        }

        if (now.isAfter(closeAt)) {
            return CheckInWindowStatus.CLOSED;
        }

        return CheckInWindowStatus.OPEN;
    }

    private String extractQrToken(String qrContent) {
        try {
            return TicketQrPayload.extractToken(qrContent);
        } catch (IllegalArgumentException exception) {
            throw new BadRequestException(
                    exception.getMessage()
            );
        }
    }
}
