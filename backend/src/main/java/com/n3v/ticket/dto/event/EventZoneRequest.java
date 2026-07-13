package com.n3v.ticket.dto.event;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class EventZoneRequest {

    @NotBlank(message = "Ten khu vuc khong duoc de trong")
    private String zoneName;

    private String description;

    @Positive(message = "Suc chua phai > 0")
    private Integer totalCapacity;

    @NotNull(message = "Vui long nhap gia ve")
    @Positive(message = "Gia ve phai > 0")
    private BigDecimal price;

    private Integer displayOrder;
}
