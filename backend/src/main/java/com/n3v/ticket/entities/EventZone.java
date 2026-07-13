package com.n3v.ticket.entities;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * Khu vuc / hang ve cua 1 su kien. Y nghia thay doi tuy theo Event.ticketMapType:
 *
 *  - ZONE:       Zone la don vi ban ve truc tiep (khach mua "1 ve khu VIP"),
 *                dung field totalCapacity + soldCount de biet con cho hay khong,
 *                KHONG can tao EventSeat con.
 *  - SEAT_MAP:   Zone dong vai tro "khu/hang ghe" (VD: Tang 1 - Khu A) de gom nhom
 *                gia ve, ben trong se co danh sach EventSeat (tung ghe cu the).
 *  - TEA_LOUNGE: Zone dong vai tro "khu vuc phong tra" (VD: Tang tret, Ban cong),
 *                ben trong co danh sach EventSeat voi seatType = TABLE (tung ban).
 */
@Entity
@Table(name = "event_zones")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EventZone {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @Column(name = "zone_name", nullable = false, length = 100)
    private String zoneName; // VD: "VIP", "Khu A", "Tang tret"

    @Column(length = 300)
    private String description;

    // Chi co y nghia bat buoc voi TicketMapType.ZONE (ban thang theo zone,
    // khong co seat con). Voi SEAT_MAP/TEA_LOUNGE co the de null vi suc chua
    // se duoc tinh tu tong so EventSeat ben trong.
    @Column(name = "total_capacity")
    private Integer totalCapacity;

    @Column(name = "sold_count")
    @Builder.Default
    private Integer soldCount = 0;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal price;

    // Thu tu hien thi tren so do (VD: VIP hien truoc thuong)
    @Column(name = "display_order")
    @Builder.Default
    private Integer displayOrder = 0;

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;

    @OneToMany(mappedBy = "eventZone", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<EventSeat> seats = new ArrayList<>();

    /**
     * So luong con lai - dung cho TicketMapType.ZONE (ban theo khu, khong co seat con).
     */
    @Transient
    public Integer getRemaining() {
        if (totalCapacity == null) return null;
        return totalCapacity - (soldCount == null ? 0 : soldCount);
    }
}
