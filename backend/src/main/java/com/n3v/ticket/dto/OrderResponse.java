package com.n3v.ticket.dto;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class OrderResponse {
    private String orderCode;
    private String status;
    private BigDecimal totalAmount;
    private String eventName;
    private String ticketDetails;
    private String checkoutUrl;
    private LocalDateTime createdAt;
    
    // Admin fields
    private String customerName;
    private String customerEmail;
    private String customerPhone;
}
