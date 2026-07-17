package com.n3v.ticket.dto.order;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class OrderStatusResponse {

    private String orderCode;
    private String orderStatus;
    private String paymentStatus;
    private boolean ticketsReady;
}
