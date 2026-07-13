package com.n3v.ticket.dto.event;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class EventUpdateRequest {

    @NotBlank(message = "Ten su kien khong duoc de trong")
    private String name;

    private String description;
    private String thumbnailUrl;
    private String bannerUrl;

    @NotNull(message = "Vui long chon danh muc")
    private Long categoryId;

    @NotBlank(message = "Vui long nhap dia diem to chuc")
    private String venueName;

    private String address;
    private String city;

    @NotNull(message = "Vui long nhap thoi gian bat dau")
    private LocalDateTime startTime;

    @NotNull(message = "Vui long nhap thoi gian ket thuc")
    private LocalDateTime endTime;

    private LocalDateTime saleStartTime;
    private LocalDateTime saleEndTime;

    // Khong cho sua ticketMapType o day - xem note trong EventService#update
}
