package com.n3v.ticket.controllers;

import com.n3v.ticket.common.exception.NotFoundException;
import com.n3v.ticket.dto.checkin.CheckInRequest;
import com.n3v.ticket.dto.checkin.CheckInResponse;
import com.n3v.ticket.entities.User;
import com.n3v.ticket.repositories.UserRepository;
import com.n3v.ticket.services.TicketService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/check-in")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminCheckInController {

    private final TicketService ticketService;
    private final UserRepository userRepository;

    @PostMapping
    public CheckInResponse checkIn(
            @Valid @RequestBody CheckInRequest request,
            Authentication authentication
    ) {
        if (authentication == null
                || authentication.getName() == null
                || authentication.getName().isBlank()) {
            throw new NotFoundException(
                    "Không tìm thấy thông tin đăng nhập"
            );
        }

        User admin = userRepository
                .findByEmail(authentication.getName())
                .orElseThrow(() ->
                        new NotFoundException(
                                "Không tìm thấy tài khoản admin"
                        )
                );

        return ticketService.checkInTicket(
                request.getQrContent(),
                admin
        );
    }
}