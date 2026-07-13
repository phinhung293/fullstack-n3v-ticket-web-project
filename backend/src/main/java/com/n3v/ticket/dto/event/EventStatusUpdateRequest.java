package com.n3v.ticket.dto.event;

import com.n3v.ticket.enums.EventStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class EventStatusUpdateRequest {

    @NotNull(message = "Vui long chon trang thai moi")
    private EventStatus status;
}
