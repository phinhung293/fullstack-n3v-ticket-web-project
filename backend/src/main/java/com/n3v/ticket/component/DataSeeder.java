package com.n3v.ticket.component;

import com.n3v.ticket.entities.Category;
import com.n3v.ticket.entities.Event;
import com.n3v.ticket.entities.EventSeat;
import com.n3v.ticket.entities.EventZone;
import com.n3v.ticket.enums.*;
import com.n3v.ticket.repositories.CategoryRepository;
import com.n3v.ticket.repositories.EventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Seed du lieu mau (Category + Event + Zone/Seat) de he thong co san du lieu test
 * ngay sau khi app khoi dong lan dau. CHI chay khi DB dang trong (chua co Category
 * nao) de tranh chen trung lap moi lan restart app - AN TOAN de chay nhieu lan.
 *
 * Moc thoi gian cua tung Event tinh TUONG DOI so voi thoi diem app khoi dong
 * (LocalDateTime.now()), de du lieu demo luon "song" thay vi bi cu di theo thoi gian -
 * ke ca 1 Event PUBLISHED nhung da qua han mua ve (saleEndTime trong qua khu) de
 * test viec API cong khai an no di (xem EventService.getPublicById / searchPublic).
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final CategoryRepository categoryRepository;
    private final EventRepository eventRepository;

    @Override
    public void run(String... args) {
        if (categoryRepository.count() > 0) {
            log.info("Da co du lieu Category san co - bo qua seed du lieu mau.");
            return;
        }

        log.info("Dang seed du lieu mau (Category + Event + Zone/Seat)...");

        Category concert = saveCategory("Concert", "concert", "Cac dem nhac, live concert");
        Category sports = saveCategory("Thể thao", "the-thao", "Giai dau, su kien the thao");
        Category arts = saveCategory("Nghệ thuật", "nghe-thuat", "Trien lam, kich, mua duong dai");

        List<Event> events = new ArrayList<>();

        events.add(seatMapEvent(concert, "seed-01",
                "Đêm nhạc Acoustic Mùa Hạ",
                "Không gian âm nhạc mộc mạc với các bản acoustic được yêu thích nhất, quy tụ dàn nghệ sĩ indie nổi bật.",
                "Nhà hát Hòa Bình", "240 Đường 3/2, Phường 12, Quận 10", "TP. Hồ Chí Minh",
                at(20, 19, 30), at(20, 22, 0), at(-10, 8, 0), at(18, 23, 59),
                900_000, 500_000, EventStatus.PUBLISHED));

        events.add(zoneEvent(sports, "seed-02",
                "Chung kết Giải Bóng Đá Sinh Viên Toàn Quốc",
                "Trận chung kết đỉnh cao của giải bóng đá sinh viên lớn nhất năm, quy tụ 2 đội xuất sắc nhất.",
                "Sân vận động Mỹ Đình", "Đường Lê Đức Thọ, Nam Từ Liêm", "Hà Nội",
                LocalDateTime.now().minusHours(2), LocalDateTime.now().plusHours(4),
                LocalDateTime.now().minusDays(15), LocalDateTime.now().plusHours(3),
                300, 120, 300_000, EventStatus.ONGOING));

        events.add(seatMapEvent(arts, "seed-03",
                "Triển lãm Nghệ thuật Đương đại Sài Gòn",
                "Triển lãm quy tụ hơn 30 tác phẩm hội họa và sắp đặt của các nghệ sĩ trẻ đương đại Việt Nam.",
                "The Factory Contemporary Arts Centre", "15 Nguyễn Ư Dĩ, Thảo Điền, Thủ Đức", "TP. Hồ Chí Minh",
                at(-10, 9, 0), at(-8, 18, 0), at(-30, 8, 0), at(-9, 18, 0),
                400_000, 150_000, EventStatus.COMPLETED));

        // Co tinh: status van la PUBLISHED nhung saleEndTime da qua (het han mua ve) va
        // su kien CHUA dien ra - dung de test API cong khai phai AN hoan toan Event nay.
        events.add(seatMapEvent(concert, "seed-04",
                "Live Concert - Ban nhạc Bức Tường",
                "Đêm nhạc rock hoài niệm cùng những ca khúc làm nên tên tuổi ban nhạc Bức Tường qua hơn 2 thập kỷ.",
                "Nhà hát Trưng Vương", "35 Nguyễn Tri Phương, Hải Châu", "Đà Nẵng",
                at(15, 20, 0), at(15, 22, 30), at(-20, 8, 0), at(-1, 23, 59),
                1_200_000, 650_000, EventStatus.PUBLISHED));

        events.add(zoneEvent(sports, "seed-05",
                "Giải Marathon Quốc tế Đà Nẵng",
                "Cung đường chạy dọc bờ biển Mỹ Khê tuyệt đẹp với các cự ly 5km, 10km, 21km và 42km.",
                "Công viên Biển Đông", "Võ Nguyên Giáp, Sơn Trà", "Đà Nẵng",
                at(30, 5, 0), at(30, 11, 0), at(-5, 8, 0), at(25, 23, 59),
                1000, 80, 350_000, EventStatus.PUBLISHED));

        events.add(seatMapEvent(arts, "seed-06",
                "Vở kịch 'Hồn Trương Ba, Da Hàng Thịt'",
                "Tác phẩm kinh điển của cố tác giả Lưu Quang Vũ được dàn dựng lại với ngôn ngữ sân khấu đương đại.",
                "Nhà hát Lớn Hà Nội", "1 Tràng Tiền, Hoàn Kiếm", "Hà Nội",
                at(7, 20, 0), at(7, 22, 15), at(-14, 8, 0), at(6, 23, 59),
                600_000, 250_000, EventStatus.PUBLISHED));

        events.add(seatMapEvent(concert, "seed-07",
                "Concert K-pop Super Fest",
                "Đại nhạc hội quy tụ dàn nghệ sĩ Kpop hàng đầu, sân khấu công nghệ LED 360 độ hiện đại nhất.",
                "Sân vận động Quốc gia Mỹ Đình", "Đường Lê Đức Thọ, Nam Từ Liêm", "Hà Nội",
                at(45, 18, 0), at(45, 23, 0), at(-2, 8, 0), at(44, 23, 59),
                1_500_000, 800_000, EventStatus.PUBLISHED));

        events.add(zoneEvent(sports, "seed-08",
                "Giải Chạy Bộ Đêm TP.HCM",
                "Giải chạy bộ về đêm dọc các tuyến phố trung tâm, khép lại mùa giải năm nay.",
                "Phố đi bộ Nguyễn Huệ", "Nguyễn Huệ, Quận 1", "TP. Hồ Chí Minh",
                at(-5, 18, 0), at(-5, 21, 0), at(-25, 8, 0), at(-6, 23, 59),
                600, 600, 150_000, EventStatus.COMPLETED));

        eventRepository.saveAll(events);
        log.info("Seed xong {} Category va {} Event mau.", 3, events.size());
    }

    // ---- helpers ----

    private Category saveCategory(String name, String slug, String description) {
        return categoryRepository.save(Category.builder()
                .name(name)
                .slug(slug)
                .description(description)
                .build());
    }

    private LocalDateTime at(int daysOffset, int hour, int minute) {
        return LocalDateTime.now().plusDays(daysOffset).withHour(hour).withMinute(minute).withSecond(0).withNano(0);
    }

    private String thumbnailUrl(String seed) {
        return "https://picsum.photos/seed/" + seed + "/800/450";
    }

    private String bannerUrl(String seed) {
        return "https://picsum.photos/seed/" + seed + "-banner/1600/700";
    }

    /**
     * Su kien co Seat Map (Concert / Nghe thuat): 1 zone duy nhat, hang A-C = VIP,
     * hang D-H = STANDARD (10 ghe/hang = 80 ghe), ~1/6 ghe duoc danh dau SOLD san de demo.
     */
    private Event seatMapEvent(Category category, String imageSeed, String name, String description,
                                String venue, String address, String city,
                                LocalDateTime start, LocalDateTime end,
                                LocalDateTime saleStart, LocalDateTime saleEnd,
                                long vipPrice, long standardPrice, EventStatus status) {
        Event event = Event.builder()
                .name(name)
                .description(description)
                .thumbnailUrl(thumbnailUrl(imageSeed))
                .bannerUrl(bannerUrl(imageSeed))
                .category(category)
                .venueName(venue)
                .address(address)
                .city(city)
                .startTime(start)
                .endTime(end)
                .saleStartTime(saleStart)
                .saleEndTime(saleEnd)
                .ticketMapType(TicketMapType.SEAT_MAP)
                .status(status)
                .build();

        EventZone zone = EventZone.builder()
                .event(event)
                .zoneName("Khu vực chính")
                .price(BigDecimal.valueOf(standardPrice))
                .displayOrder(0)
                .active(true)
                .build();

        List<EventSeat> seats = new ArrayList<>();
        String[] vipRows = {"A", "B", "C"};
        String[] standardRows = {"D", "E", "F", "G", "H"};
        int seatIndex = 0;

        for (String row : vipRows) {
            for (int col = 1; col <= 10; col++) {
                seats.add(buildSeat(zone, row, col, SeatTier.VIP, BigDecimal.valueOf(vipPrice), ++seatIndex));
            }
        }
        for (String row : standardRows) {
            for (int col = 1; col <= 10; col++) {
                seats.add(buildSeat(zone, row, col, SeatTier.STANDARD, BigDecimal.valueOf(standardPrice), ++seatIndex));
            }
        }

        zone.setSeats(seats);
        event.setZones(new ArrayList<>(List.of(zone)));
        return event;
    }

    private EventSeat buildSeat(EventZone zone, String row, int col, SeatTier tier, BigDecimal price, int seatIndex) {
        boolean sold = seatIndex % 6 == 0; // ~1/6 ghe demo "da ban" de seat map co du 3 mau
        return EventSeat.builder()
                .eventZone(zone)
                .seatType(SeatType.SEAT)
                .seatTier(tier)
                .seatRow(row)
                .seatColumn(col)
                .seatCode(row + col)
                .price(price)
                .status(sold ? SeatStatus.SOLD : SeatStatus.AVAILABLE)
                .build();
    }

    /**
     * Su kien khong co Seat Map (The thao): 1 zone duy nhat dai dien "Ve thuong",
     * ban theo so luong (totalCapacity/soldCount), khong tao EventSeat con.
     */
    private Event zoneEvent(Category category, String imageSeed, String name, String description,
                             String venue, String address, String city,
                             LocalDateTime start, LocalDateTime end,
                             LocalDateTime saleStart, LocalDateTime saleEnd,
                             int totalCapacity, int soldCount, long price, EventStatus status) {
        Event event = Event.builder()
                .name(name)
                .description(description)
                .thumbnailUrl(thumbnailUrl(imageSeed))
                .bannerUrl(bannerUrl(imageSeed))
                .category(category)
                .venueName(venue)
                .address(address)
                .city(city)
                .startTime(start)
                .endTime(end)
                .saleStartTime(saleStart)
                .saleEndTime(saleEnd)
                .ticketMapType(TicketMapType.ZONE)
                .status(status)
                .build();

        EventZone zone = EventZone.builder()
                .event(event)
                .zoneName("Vé thường")
                .totalCapacity(totalCapacity)
                .soldCount(soldCount)
                .price(BigDecimal.valueOf(price))
                .displayOrder(0)
                .active(true)
                .build();

        event.setZones(new ArrayList<>(List.of(zone)));
        return event;
    }
}
