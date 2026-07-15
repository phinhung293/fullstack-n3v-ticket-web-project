package com.n3v.ticket.controllers;

import com.n3v.ticket.common.exception.NotFoundException;
import com.n3v.ticket.dto.checkin.CheckInRequest;
import com.n3v.ticket.dto.checkin.CheckInResponse;
import com.n3v.ticket.entities.User;
import com.n3v.ticket.repositories.UserRepository;
import com.n3v.ticket.services.TicketService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/check-in")
@RequiredArgsConstructor
public class AdminCheckInController {

    private final TicketService ticketService;
    private final UserRepository userRepository;

    @PostMapping
    public CheckInResponse checkIn(
            @Valid @RequestBody CheckInRequest request,
            Authentication authentication
    ) {
        User admin = userRepository
                .findByEmail(authentication.getName())
                .orElseThrow(() ->
                        new NotFoundException("Không tìm thấy người dùng")
                );

        return ticketService.checkInTicket(
                request.getQrContent(),
                admin
        );
    }
}