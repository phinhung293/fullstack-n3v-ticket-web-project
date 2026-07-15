package com.n3v.ticket.services;

import com.n3v.ticket.dto.checkin.CheckInResponse;
import com.n3v.ticket.entities.ETicket;
import com.n3v.ticket.entities.Event;
import com.n3v.ticket.entities.EventSeat;
import com.n3v.ticket.entities.EventZone;
import com.n3v.ticket.entities.Order;
import com.n3v.ticket.entities.OrderItem;
import com.n3v.ticket.entities.User;
import com.n3v.ticket.enums.TicketStatus;
import com.n3v.ticket.repositories.ETicketRepository;
import com.n3v.ticket.common.exception.BadRequestException;
import com.n3v.ticket.common.exception.NotFoundException;
import org.springframework.security.access.AccessDeniedException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.n3v.ticket.dto.ticket.TicketResponse;

import java.security.SecureRandom;
import java.time.OffsetDateTime;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TicketService {

    private final ETicketRepository eTicketRepository;

    private final SecureRandom secureRandom = new SecureRandom();

    private final QrCodeService qrCodeService;

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

        if (ticket.getUser() == null
                || !ticket.getUser().getEmail().equalsIgnoreCase(userEmail)) {

            throw new AccessDeniedException(
                    "Bạn không có quyền xem mã QR của vé này"
            );
        }

        String qrContent =
                "N3V:TICKET:" + ticket.getQrCodeHash();

        return qrCodeService.generatePng(
                qrContent,
                500,
                500
        );
    }

    @Transactional
    public CheckInResponse checkInTicket(
            String qrContent,
            User checkedInBy
    ) {
        String qrToken = extractQrToken(qrContent);

        ETicket ticket = eTicketRepository
                .findByQrCodeHashForUpdate(qrToken)
                .orElseThrow(() ->
                        new BadRequestException("Mã QR không hợp lệ")
                );

        if (ticket.getStatus() == TicketStatus.CHECKED_IN) {
            return CheckInResponse.builder()
                    .success(false)
                    .message("Vé đã được check-in trước đó")
                    .ticketCode(ticket.getTicketCode())
                    .ticketStatus(ticket.getStatus().name())
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
                    .build();
        }

        if (ticket.getStatus() != TicketStatus.ISSUED) {
            return CheckInResponse.builder()
                    .success(false)
                    .message("Vé không còn hiệu lực")
                    .ticketCode(ticket.getTicketCode())
                    .ticketStatus(ticket.getStatus().name())
                    .build();
        }

        OffsetDateTime now = OffsetDateTime.now();

        ticket.setStatus(TicketStatus.CHECKED_IN);
        ticket.setCheckedInAt(now);
        ticket.setCheckedInBy(checkedInBy);

        eTicketRepository.save(ticket);

        return CheckInResponse.builder()
                .success(true)
                .message("Check-in thành công")
                .ticketCode(ticket.getTicketCode())
                .ticketStatus(ticket.getStatus().name())
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
                .build();
    }

    private String extractQrToken(String qrContent) {

        String prefix = "N3V:TICKET:";

        if (qrContent == null || !qrContent.startsWith(prefix)) {
            throw new BadRequestException(
                    "Định dạng mã QR không hợp lệ"
            );
        }

        String qrToken = qrContent.substring(prefix.length()).trim();

        if (qrToken.isBlank()) {
            throw new BadRequestException(
                    "Mã QR không hợp lệ"
            );
        }

        return qrToken;
    }
}