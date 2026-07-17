package com.n3v.ticket.common;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class TicketQrPayloadTest {

    @Test
    void createsAndReadsTheSameTicketPayload() {
        String token = "0123456789abcdef";

        String payload = TicketQrPayload.fromToken(token);

        assertEquals("N3V:TICKET:" + token, payload);
        assertEquals(token, TicketQrPayload.extractToken(payload));
    }

    @Test
    void rejectsOrderCodeOrEmptyTicketPayload() {
        assertThrows(
                IllegalArgumentException.class,
                () -> TicketQrPayload.extractToken("123456789")
        );
        assertThrows(
                IllegalArgumentException.class,
                () -> TicketQrPayload.extractToken("N3V:TICKET:   ")
        );
    }
}
