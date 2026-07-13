package com.n3v.ticket.entities;

import com.n3v.ticket.enums.SeatStatus;
import com.n3v.ticket.enums.SeatTier;
import com.n3v.ticket.enums.SeatType;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

/**
 * 1 ghe (SEAT_MAP) hoac 1 ban (TEA_LOUNGE) cu the ben trong 1 EventZone.
 * Khong dung cho TicketMapType.ZONE (loai do ban thang o cap EventZone).
 *
 * Module "Dat ve & thanh toan" (Nhung) se doc/ghi status cua bang nay de
 * thuc hien thuat toan lock-seat, nen ten field & enum can giu on dinh.
 */
@Entity
@Table(
    name = "event_seats",
    uniqueConstraints = @UniqueConstraint(
        name = "uk_zone_seat_code",
        columnNames = {"zone_id", "seat_code"}
    )
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EventSeat {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "zone_id", nullable = false)
    private EventZone eventZone;

    @Enumerated(EnumType.STRING)
    @Column(name = "seat_type", nullable = false, length = 10)
    private SeatType seatType;

    // VD SEAT: hang "A" cot "12" -> seatCode "A12"
    // VD TABLE: seatCode "T01" (Ban 01)
    @Column(name = "seat_row", length = 10)
    private String seatRow;

    @Column(name = "seat_column")
    private Integer seatColumn;

    @Column(name = "seat_code", nullable = false, length = 20)
    private String seatCode;

    // Chi dung khi seatType = TABLE: so nguoi toi da / ban
    @Column(name = "capacity")
    private Integer capacity;

    // VIP / STANDARD - quyet dinh mau hien thi & gia goi y tren seat map (Concert, Nghe thuat).
    // Khong bat buoc voi seatType = TABLE (TEA_LOUNGE), nhung van co gia tri mac dinh de tranh null.
    @Enumerated(EnumType.STRING)
    @Column(name = "seat_tier", nullable = false, length = 20)
    @Builder.Default
    private SeatTier seatTier = SeatTier.STANDARD;

    // Cho phep gia rieng theo tung ghe/ban (override gia zone), null = lay gia zone
    @Column(precision = 12, scale = 2)
    private BigDecimal price;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private SeatStatus status = SeatStatus.AVAILABLE;

    @PrePersist
    protected void onCreate() {
        if (this.status == null) {
            this.status = SeatStatus.AVAILABLE;
        }
        if (this.seatTier == null) {
            this.seatTier = SeatTier.STANDARD;
        }
    }
}
