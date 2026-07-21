package com.n3v.ticket.controllers;

import com.n3v.ticket.common.exception.NotFoundException;
import com.n3v.ticket.dto.ticket.TicketResponse;
import com.n3v.ticket.entities.User;
import com.n3v.ticket.repositories.UserRepository;
import com.n3v.ticket.services.TicketService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
public class TicketController {

    private final TicketService ticketService;
    private final UserRepository userRepository;

    @GetMapping("/my-tickets")
    public List<TicketResponse> getMyTickets(
            Authentication authentication
    ) {
        User user = userRepository
                .findByEmail(authentication.getName())
                .orElseThrow(() ->
                        new NotFoundException("Không tìm thấy người dùng")
                );

        return ticketService.getMyTickets(user);
    }

    @GetMapping(
            value = "/{ticketId}/qr",
            produces = MediaType.IMAGE_PNG_VALUE
    )
    public ResponseEntity<byte[]> getTicketQr(
            @PathVariable Long ticketId,
            Authentication authentication
    ) {
        byte[] qrImage = ticketService.generateQrForUser(
                ticketId,
                authentication.getName()
        );

        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_PNG)
                .cacheControl(CacheControl.noStore())
                .body(qrImage);
    }
}