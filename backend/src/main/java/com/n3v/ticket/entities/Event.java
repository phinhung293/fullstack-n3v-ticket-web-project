package com.n3v.ticket.entities;

import com.n3v.ticket.enums.EventStatus;
import com.n3v.ticket.enums.TicketMapType;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Su kien. 1 Event thuoc 1 Category, va co 1 kieu ban ve (TicketMapType)
 * quyet dinh viec dung EventZone / EventSeat nhu the nao (xem note trong 2 entity do).
 */
@Entity
@Table(name = "events")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Event {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "thumbnail_url")
    private String thumbnailUrl;

    // Cac anh chi tiet, banner... co the tach bang rieng (EventImage) neu can nhieu anh.
    // O day gian luoc lai 1 truong banner_url cho don gian.
    @Column(name = "banner_url")
    private String bannerUrl;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @Column(name = "venue_name", length = 200)
    private String venueName;

    @Column(length = 300)
    private String address;

    // Cho phep tim theo tinh/thanh de loc nhanh o trang chu
    @Column(length = 100)
    private String city;

    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalDateTime endTime;

    @Column(name = "sale_start_time")
    private LocalDateTime saleStartTime;

    @Column(name = "sale_end_time")
    private LocalDateTime saleEndTime;

    @Enumerated(EnumType.STRING)
    @Column(name = "ticket_map_type", nullable = false, length = 20)
    private TicketMapType ticketMapType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private EventStatus status = EventStatus.DRAFT;

    // id cua admin/organizer tao su kien - tham chieu sang bang User cua module Xac thuc,
    // khong map @ManyToOne sang entity User o day de tranh phu thuoc cheo module luc dev song song.
    @Column(name = "created_by")
    private Long createdBy;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "event", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<EventZone> zones = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.status == null) {
            this.status = EventStatus.DRAFT;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
