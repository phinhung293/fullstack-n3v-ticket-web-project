package com.n3v.ticket.controllers;

import com.fasterxml.jackson.databind.node.ObjectNode;
import com.n3v.ticket.services.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {
    private final PaymentService paymentService;

    @PostMapping("/webhook")
    public ObjectNode handleWebhook(@RequestBody ObjectNode webhookBody) {
        return paymentService.handleWebhook(webhookBody);
    }
}
