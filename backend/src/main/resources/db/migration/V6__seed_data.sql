-- ============================================================
-- V6 - Seed toàn bộ dữ liệu mẫu (gộp từ V6 + V7 + V8 + V9 cũ)
--
-- LƯU Ý QUAN TRỌNG:
-- created_by để NULL (không hardcode = 2) vì user admin thật chỉ được
-- tạo bởi DataSeeder (component Java) SAU KHI Flyway chạy xong - trên
-- DB sạch, lúc Flyway chạy chưa có user nào cả nên hardcode id sẽ vỡ
-- FK constraint "events_created_by_fkey". Cột này nullable nên an toàn.
-- ============================================================

------------------------------------------------------------
-- CATEGORY
------------------------------------------------------------

INSERT INTO categories(name, slug, description, icon_url)
SELECT 'Âm nhạc', 'am-nhac', 'Các sự kiện âm nhạc',
    'https://cdn-icons-png.flaticon.com/512/3659/3659784.png'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug='am-nhac');

INSERT INTO categories(name, slug, description, icon_url)
SELECT 'Thể thao', 'the-thao', 'Các sự kiện thể thao',
    'https://cdn-icons-png.flaticon.com/512/857/857455.png'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug='the-thao');

INSERT INTO categories(name, slug, description, icon_url)
SELECT 'Nghệ thuật', 'nghe-thuat', 'Các sự kiện nghệ thuật',
    'https://cdn-icons-png.flaticon.com/512/2917/2917992.png'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug='nghe-thuat');

------------------------------------------------------------
-- EVENT 1-3 (cố định ngày 2026, dữ liệu gốc)
------------------------------------------------------------

INSERT INTO events (category_id, name, description, thumbnail_url, banner_url, venue_name, address, city,
    start_time, end_time, sale_start_time, sale_end_time, ticket_map_type, status, created_by)
SELECT (SELECT id FROM categories WHERE slug='am-nhac'),
    'Sky Music Festival 2026',
    'Đại nhạc hội ngoài trời quy tụ nhiều ca sĩ nổi tiếng.',
    'https://images.unsplash.com/photo-1501386761578-eac5c94b800a',
    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f',
    'Nhà thi đấu Phú Thọ', '219 Lý Thường Kiệt', 'TP. Hồ Chí Minh',
    '2026-09-20 19:00:00', '2026-09-20 23:00:00', '2026-07-20 00:00:00', '2026-09-19 23:59:59',
    'SEAT_MAP', 'PUBLISHED', NULL
WHERE NOT EXISTS (SELECT 1 FROM events WHERE name='Sky Music Festival 2026');

INSERT INTO events (category_id, name, description, thumbnail_url, banner_url, venue_name, address, city,
    start_time, end_time, sale_start_time, sale_end_time, ticket_map_type, status, created_by)
SELECT (SELECT id FROM categories WHERE slug='the-thao'),
    'Giải Marathon Hà Nội',
    'Giải chạy thường niên dành cho mọi lứa tuổi.',
    'https://images.unsplash.com/photo-1552674605-db6ffd4facb5',
    'https://images.unsplash.com/photo-1517649763962-0c623066013b',
    'Hồ Gươm', 'Đinh Tiên Hoàng', 'Hà Nội',
    '2026-08-15 05:30:00', '2026-08-15 11:00:00', '2026-06-01 00:00:00', '2026-08-14 23:59:59',
    'ZONE', 'PUBLISHED', NULL
WHERE NOT EXISTS (SELECT 1 FROM events WHERE name='Giải Marathon Hà Nội');

INSERT INTO events (category_id, name, description, thumbnail_url, banner_url, venue_name, address, city,
    start_time, end_time, sale_start_time, sale_end_time, ticket_map_type, status, created_by)
SELECT (SELECT id FROM categories WHERE slug='nghe-thuat'),
    'Đêm Ballet Quốc Gia',
    'Đêm biểu diễn Ballet đặc sắc.',
    'https://images.unsplash.com/photo-1503095396549-807759245b35',
    'https://images.unsplash.com/photo-1516280440614-37939bbacd81',
    'Nhà hát Thành phố', '07 Công Trường Lam Sơn', 'TP. Hồ Chí Minh',
    '2026-10-01 19:30:00', '2026-10-01 22:00:00', '2026-08-01 00:00:00', '2026-09-30 23:59:59',
    'TEA_LOUNGE', 'PUBLISHED', NULL
WHERE NOT EXISTS (SELECT 1 FROM events WHERE name='Đêm Ballet Quốc Gia');

------------------------------------------------------------
-- EVENT 4-8 (đa dạng trạng thái, dùng NOW() +/- INTERVAL)
------------------------------------------------------------

INSERT INTO events (category_id, name, description, thumbnail_url, banner_url, venue_name, address, city,
    start_time, end_time, sale_start_time, sale_end_time, ticket_map_type, status, created_by)
SELECT (SELECT id FROM categories WHERE slug='am-nhac'),
    'Rock Fest Sài Gòn',
    'Đêm nhạc rock sôi động đang diễn ra ngay lúc này.',
    'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3',
    'https://images.unsplash.com/photo-1470225620780-dba8ba36b745',
    'Sân vận động Thống Nhất', '138 Đào Duy Từ', 'TP. Hồ Chí Minh',
    NOW() - INTERVAL '2 hours', NOW() + INTERVAL '3 hours',
    NOW() - INTERVAL '20 days', NOW() - INTERVAL '1 hour',
    'SEAT_MAP', 'ONGOING', NULL
WHERE NOT EXISTS (SELECT 1 FROM events WHERE name='Rock Fest Sài Gòn');

INSERT INTO events (category_id, name, description, thumbnail_url, banner_url, venue_name, address, city,
    start_time, end_time, sale_start_time, sale_end_time, ticket_map_type, status, created_by)
SELECT (SELECT id FROM categories WHERE slug='nghe-thuat'),
    'Đêm Nhạc Trịnh Acoustic',
    'Đêm nhạc phòng trà đã diễn ra và kết thúc.',
    'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae',
    'https://images.unsplash.com/photo-1465847899084-d164df4dedc6',
    'Phòng trà Bến Thành', '162 Đề Thám', 'TP. Hồ Chí Minh',
    NOW() - INTERVAL '10 days', NOW() - INTERVAL '9 days 21 hours',
    NOW() - INTERVAL '30 days', NOW() - INTERVAL '11 days',
    'TEA_LOUNGE', 'COMPLETED', NULL
WHERE NOT EXISTS (SELECT 1 FROM events WHERE name='Đêm Nhạc Trịnh Acoustic');

INSERT INTO events (category_id, name, description, thumbnail_url, banner_url, venue_name, address, city,
    start_time, end_time, sale_start_time, sale_end_time, ticket_map_type, status, created_by)
SELECT (SELECT id FROM categories WHERE slug='am-nhac'),
    'Jazz Night Hà Nội (Hết hạn bán vé)',
    'Sự kiện còn hiển thị PUBLISHED nhưng đã hết hạn mở bán vé.',
    'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f',
    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f',
    'Nhà hát Lớn Hà Nội', '1 Tràng Tiền', 'Hà Nội',
    NOW() + INTERVAL '5 days', NOW() + INTERVAL '5 days 3 hours',
    NOW() - INTERVAL '15 days', NOW() - INTERVAL '1 day',
    'SEAT_MAP', 'PUBLISHED', NULL
WHERE NOT EXISTS (SELECT 1 FROM events WHERE name='Jazz Night Hà Nội (Hết hạn bán vé)');

INSERT INTO events (category_id, name, description, thumbnail_url, banner_url, venue_name, address, city,
    start_time, end_time, sale_start_time, sale_end_time, ticket_map_type, status, created_by)
SELECT (SELECT id FROM categories WHERE slug='the-thao'),
    'Giải Chạy Đêm Đà Nẵng (Đã hủy)',
    'Sự kiện đã bị hủy do thời tiết.',
    'https://images.unsplash.com/photo-1571008887538-b36bb32f4571',
    'https://images.unsplash.com/photo-1461896836934-ffe607ba8211',
    'Cầu Rồng', 'Bạch Đằng', 'Đà Nẵng',
    NOW() + INTERVAL '20 days', NOW() + INTERVAL '20 days 4 hours',
    NOW() - INTERVAL '5 days', NOW() + INTERVAL '19 days',
    'ZONE', 'CANCELLED', NULL
WHERE NOT EXISTS (SELECT 1 FROM events WHERE name='Giải Chạy Đêm Đà Nẵng (Đã hủy)');

INSERT INTO events (category_id, name, description, thumbnail_url, banner_url, venue_name, address, city,
    start_time, end_time, sale_start_time, sale_end_time, ticket_map_type, status, created_by)
SELECT (SELECT id FROM categories WHERE slug='the-thao'),
    'Giải Bóng Chuyền Bãi Biển Vũng Tàu',
    'Giải đấu bóng chuyền bãi biển thường niên, đang mở bán vé.',
    'https://images.unsplash.com/photo-1592656094267-764a45160876',
    'https://images.unsplash.com/photo-1544717305-2782549b5136',
    'Bãi Sau', 'Thùy Vân', 'Vũng Tàu',
    NOW() + INTERVAL '30 days', NOW() + INTERVAL '30 days 6 hours',
    NOW() - INTERVAL '2 days', NOW() + INTERVAL '29 days',
    'ZONE', 'PUBLISHED', NULL
WHERE NOT EXISTS (SELECT 1 FROM events WHERE name='Giải Bóng Chuyền Bãi Biển Vũng Tàu');

------------------------------------------------------------
-- EVENT 9-20 (đa dạng danh mục/loại vé/trạng thái/thành phố)
------------------------------------------------------------

INSERT INTO events (category_id, name, description, thumbnail_url, banner_url, venue_name, address, city,
    start_time, end_time, sale_start_time, sale_end_time, ticket_map_type, status, created_by)
SELECT (SELECT id FROM categories WHERE slug='am-nhac'),
    'Coldplay Tribute Night',
    'Đêm nhạc tưởng nhớ phong cách Coldplay với dàn nhạc sống.',
    'https://images.unsplash.com/photo-1459749411175-04bf5292ceea',
    'https://images.unsplash.com/photo-1571266752264-7a1e5f31b8f6',
    'Nhà thi đấu Quân khu 7', '202 Hoàng Văn Thụ', 'TP. Hồ Chí Minh',
    NOW() + INTERVAL '40 days', NOW() + INTERVAL '40 days 3 hours',
    NOW() - INTERVAL '5 days', NOW() + INTERVAL '39 days',
    'SEAT_MAP', 'PUBLISHED', NULL
WHERE NOT EXISTS (SELECT 1 FROM events WHERE name='Coldplay Tribute Night');

INSERT INTO events (category_id, name, description, thumbnail_url, banner_url, venue_name, address, city,
    start_time, end_time, sale_start_time, sale_end_time, ticket_map_type, status, created_by)
SELECT (SELECT id FROM categories WHERE slug='am-nhac'),
    'EDM Fest Đà Nẵng',
    'Lễ hội âm nhạc điện tử ngoài trời, vé đứng tự do theo khu vực.',
    'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3',
    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f',
    'Công viên Biển Đông', 'Võ Nguyên Giáp', 'Đà Nẵng',
    NOW() + INTERVAL '25 days', NOW() + INTERVAL '25 days 6 hours',
    NOW() - INTERVAL '3 days', NOW() + INTERVAL '24 days',
    'ZONE', 'PUBLISHED', NULL
WHERE NOT EXISTS (SELECT 1 FROM events WHERE name='EDM Fest Đà Nẵng');

INSERT INTO events (category_id, name, description, thumbnail_url, banner_url, venue_name, address, city,
    start_time, end_time, sale_start_time, sale_end_time, ticket_map_type, status, created_by)
SELECT (SELECT id FROM categories WHERE slug='the-thao'),
    'Giải Bóng Rổ 3x3 Sinh Viên',
    'Giải đấu bóng rổ 3x3 dành cho sinh viên toàn quốc, đang diễn ra.',
    'https://images.unsplash.com/photo-1546519638-68e109498ffc',
    'https://images.unsplash.com/photo-1518063319789-7217e6706b04',
    'Cung Thể thao Quần Ngựa', 'Đội Cấn', 'Hà Nội',
    NOW() - INTERVAL '3 hours', NOW() + INTERVAL '5 hours',
    NOW() - INTERVAL '25 days', NOW() - INTERVAL '2 hours',
    'ZONE', 'ONGOING', NULL
WHERE NOT EXISTS (SELECT 1 FROM events WHERE name='Giải Bóng Rổ 3x3 Sinh Viên');

INSERT INTO events (category_id, name, description, thumbnail_url, banner_url, venue_name, address, city,
    start_time, end_time, sale_start_time, sale_end_time, ticket_map_type, status, created_by)
SELECT (SELECT id FROM categories WHERE slug='the-thao'),
    'Chung Kết Cờ Vua Quốc Gia',
    'Vòng chung kết giải cờ vua quốc gia, khán giả ngồi theo sơ đồ khán đài.',
    'https://images.unsplash.com/photo-1580541631950-7282082b53fe',
    'https://images.unsplash.com/photo-1528819622765-d6bcf132ac11',
    'Trung tâm Hội nghị Quốc gia', 'Phạm Hùng', 'Hà Nội',
    NOW() + INTERVAL '15 days', NOW() + INTERVAL '15 days 8 hours',
    NOW() - INTERVAL '10 days', NOW() + INTERVAL '14 days',
    'SEAT_MAP', 'PUBLISHED', NULL
WHERE NOT EXISTS (SELECT 1 FROM events WHERE name='Chung Kết Cờ Vua Quốc Gia');

INSERT INTO events (category_id, name, description, thumbnail_url, banner_url, venue_name, address, city,
    start_time, end_time, sale_start_time, sale_end_time, ticket_map_type, status, created_by)
SELECT (SELECT id FROM categories WHERE slug='nghe-thuat'),
    'Triển Lãm Tranh Đương Đại',
    'Đêm khai mạc triển lãm tranh đương đại kết hợp trình diễn âm nhạc phòng trà.',
    'https://images.unsplash.com/photo-1541961017774-22349e4a1262',
    'https://images.unsplash.com/photo-1531058020387-3be344556be6',
    'Bảo tàng Mỹ thuật TP.HCM', '97A Phó Đức Chính', 'TP. Hồ Chí Minh',
    NOW() + INTERVAL '12 days', NOW() + INTERVAL '12 days 3 hours',
    NOW() - INTERVAL '4 days', NOW() + INTERVAL '11 days',
    'TEA_LOUNGE', 'PUBLISHED', NULL
WHERE NOT EXISTS (SELECT 1 FROM events WHERE name='Triển Lãm Tranh Đương Đại');

INSERT INTO events (category_id, name, description, thumbnail_url, banner_url, venue_name, address, city,
    start_time, end_time, sale_start_time, sale_end_time, ticket_map_type, status, created_by)
SELECT (SELECT id FROM categories WHERE slug='nghe-thuat'),
    'Đêm Nhạc Kịch Broadway',
    'Vở nhạc kịch Broadway đã công diễn và kết thúc thành công.',
    'https://images.unsplash.com/photo-1503095396549-807759245b35',
    'https://images.unsplash.com/photo-1516280440614-37939bbacd81',
    'Nhà hát Lớn Hà Nội', '1 Tràng Tiền', 'Hà Nội',
    NOW() - INTERVAL '20 days', NOW() - INTERVAL '19 days 21 hours',
    NOW() - INTERVAL '40 days', NOW() - INTERVAL '21 days',
    'SEAT_MAP', 'COMPLETED', NULL
WHERE NOT EXISTS (SELECT 1 FROM events WHERE name='Đêm Nhạc Kịch Broadway');

INSERT INTO events (category_id, name, description, thumbnail_url, banner_url, venue_name, address, city,
    start_time, end_time, sale_start_time, sale_end_time, ticket_map_type, status, created_by)
SELECT (SELECT id FROM categories WHERE slug='the-thao'),
    'Giải Golf Từ Thiện',
    'Giải golf gây quỹ từ thiện, vé sẽ mở bán trong thời gian tới.',
    'https://images.unsplash.com/photo-1535131749006-b7f58c99034b',
    'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa',
    'Sân Golf Long Thành', 'Long Thành', 'Đồng Nai',
    NOW() + INTERVAL '50 days', NOW() + INTERVAL '50 days 8 hours',
    NOW() + INTERVAL '10 days', NOW() + INTERVAL '49 days',
    'ZONE', 'PUBLISHED', NULL
WHERE NOT EXISTS (SELECT 1 FROM events WHERE name='Giải Golf Từ Thiện');

INSERT INTO events (category_id, name, description, thumbnail_url, banner_url, venue_name, address, city,
    start_time, end_time, sale_start_time, sale_end_time, ticket_map_type, status, created_by)
SELECT (SELECT id FROM categories WHERE slug='nghe-thuat'),
    'Workshop Vẽ Tranh Sơn Dầu',
    'Sự kiện đang soạn thảo, chưa công khai.',
    'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b',
    'https://images.unsplash.com/photo-1499781350541-7783f6c6a0c8',
    'Xưởng vẽ Cộng Sáng Tạo', '15 Nguyễn Huệ', 'TP. Hồ Chí Minh',
    NOW() + INTERVAL '60 days', NOW() + INTERVAL '60 days 4 hours',
    NOW() + INTERVAL '30 days', NOW() + INTERVAL '59 days',
    'TEA_LOUNGE', 'DRAFT', NULL
WHERE NOT EXISTS (SELECT 1 FROM events WHERE name='Workshop Vẽ Tranh Sơn Dầu');

INSERT INTO events (category_id, name, description, thumbnail_url, banner_url, venue_name, address, city,
    start_time, end_time, sale_start_time, sale_end_time, ticket_map_type, status, created_by)
SELECT (SELECT id FROM categories WHERE slug='am-nhac'),
    'US-Vietnam Friendship Concert (Đã hủy)',
    'Sự kiện đã bị hủy do vấn đề cấp phép.',
    'https://images.unsplash.com/photo-1508973379184-7517410fb0bc',
    'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec',
    'SECC', '799 Nguyễn Văn Linh', 'TP. Hồ Chí Minh',
    NOW() + INTERVAL '35 days', NOW() + INTERVAL '35 days 3 hours',
    NOW() - INTERVAL '8 days', NOW() + INTERVAL '34 days',
    'SEAT_MAP', 'CANCELLED', NULL
WHERE NOT EXISTS (SELECT 1 FROM events WHERE name='US-Vietnam Friendship Concert (Đã hủy)');

INSERT INTO events (category_id, name, description, thumbnail_url, banner_url, venue_name, address, city,
    start_time, end_time, sale_start_time, sale_end_time, ticket_map_type, status, created_by)
SELECT (SELECT id FROM categories WHERE slug='am-nhac'),
    'Đại Nhạc Hội Mùa Đông Đà Lạt',
    'Đêm nhạc acoustic giữa lòng thành phố sương mù.',
    'https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b',
    'https://images.unsplash.com/photo-1470225620780-dba8ba36b745',
    'Quảng trường Lâm Viên', 'Trần Quốc Toản', 'Đà Lạt',
    NOW() + INTERVAL '45 days', NOW() + INTERVAL '45 days 3 hours',
    NOW() - INTERVAL '5 days', NOW() + INTERVAL '44 days',
    'SEAT_MAP', 'PUBLISHED', NULL
WHERE NOT EXISTS (SELECT 1 FROM events WHERE name='Đại Nhạc Hội Mùa Đông Đà Lạt');

INSERT INTO events (category_id, name, description, thumbnail_url, banner_url, venue_name, address, city,
    start_time, end_time, sale_start_time, sale_end_time, ticket_map_type, status, created_by)
SELECT (SELECT id FROM categories WHERE slug='the-thao'),
    'Giải Marathon Biển Nha Trang',
    'Giải chạy marathon dọc bờ biển Nha Trang.',
    'https://images.unsplash.com/photo-1452626212852-811d58933cae',
    'https://images.unsplash.com/photo-1517649763962-0c623066013b',
    'Quảng trường 2/4', 'Trần Phú', 'Nha Trang',
    NOW() + INTERVAL '55 days', NOW() + INTERVAL '55 days 5 hours',
    NOW() - INTERVAL '10 days', NOW() + INTERVAL '54 days',
    'ZONE', 'PUBLISHED', NULL
WHERE NOT EXISTS (SELECT 1 FROM events WHERE name='Giải Marathon Biển Nha Trang');

INSERT INTO events (category_id, name, description, thumbnail_url, banner_url, venue_name, address, city,
    start_time, end_time, sale_start_time, sale_end_time, ticket_map_type, status, created_by)
SELECT (SELECT id FROM categories WHERE slug='nghe-thuat'),
    'Đêm Độc Tấu Piano Cổ Điển',
    'Đêm độc tấu piano đang diễn ra tại phòng trà.',
    'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0',
    'https://images.unsplash.com/photo-1465847899084-d164df4dedc6',
    'Phòng trà Không Tên', '112 Nguyễn Trãi', 'TP. Hồ Chí Minh',
    NOW() - INTERVAL '1 hour', NOW() + INTERVAL '1 hour 30 minutes',
    NOW() - INTERVAL '18 days', NOW() - INTERVAL '30 minutes',
    'TEA_LOUNGE', 'ONGOING', NULL
WHERE NOT EXISTS (SELECT 1 FROM events WHERE name='Đêm Độc Tấu Piano Cổ Điển');

------------------------------------------------------------
-- EVENT ZONES cho TẤT CẢ 20 event (idempotent qua NOT EXISTS,
-- 1 lần chạy duy nhất áp cho toàn bộ)
------------------------------------------------------------

INSERT INTO event_zones (event_id, zone_name, description, total_capacity, sold_count, price, display_order, active)
SELECT id, 'VIP', 'Khu VIP', 150, 35, 2000000, 1, TRUE
FROM events
WHERE NOT EXISTS (SELECT 1 FROM event_zones WHERE event_id = events.id AND zone_name = 'VIP');

INSERT INTO event_zones (event_id, zone_name, description, total_capacity, sold_count, price, display_order, active)
SELECT id, 'STANDARD', 'Khu Standard', 400, 150, 1200000, 2, TRUE
FROM events
WHERE NOT EXISTS (SELECT 1 FROM event_zones WHERE event_id = events.id AND zone_name = 'STANDARD');

INSERT INTO event_zones (event_id, zone_name, description, total_capacity, sold_count, price, display_order, active)
SELECT id, 'ECONOMY', 'Khu Economy', 700, 300, 700000, 3, TRUE
FROM events
WHERE NOT EXISTS (SELECT 1 FROM event_zones WHERE event_id = events.id AND zone_name = 'ECONOMY');

------------------------------------------------------------
-- EVENT SEATS cho các event SEAT_MAP/TEA_LOUNGE (zone VIP: A-B x 6,
-- zone STANDARD: C-E x 8). Idempotent qua NOT EXISTS.
------------------------------------------------------------

INSERT INTO event_seats (zone_id, seat_type, seat_row, seat_column, seat_code, capacity, price, status, seat_tier)
SELECT
    z.id,
    CASE WHEN e.ticket_map_type = 'TEA_LOUNGE' THEN 'TABLE' ELSE 'SEAT' END,
    r.row_letter, c.col_no, r.row_letter || c.col_no,
    CASE WHEN e.ticket_map_type = 'TEA_LOUNGE' THEN 4 ELSE NULL END,
    NULL,
    CASE WHEN r.row_letter = 'A' AND c.col_no <= 2 THEN 'SOLD' ELSE 'AVAILABLE' END,
    'VIP'
FROM event_zones z
JOIN events e ON e.id = z.event_id
CROSS JOIN (VALUES ('A'), ('B')) AS r(row_letter)
CROSS JOIN generate_series(1, 6) AS c(col_no)
WHERE z.zone_name = 'VIP'
  AND e.ticket_map_type IN ('SEAT_MAP', 'TEA_LOUNGE')
  AND NOT EXISTS (
      SELECT 1 FROM event_seats s WHERE s.zone_id = z.id AND s.seat_code = r.row_letter || c.col_no
  );

INSERT INTO event_seats (zone_id, seat_type, seat_row, seat_column, seat_code, capacity, price, status, seat_tier)
SELECT
    z.id,
    CASE WHEN e.ticket_map_type = 'TEA_LOUNGE' THEN 'TABLE' ELSE 'SEAT' END,
    r.row_letter, c.col_no, r.row_letter || c.col_no,
    CASE WHEN e.ticket_map_type = 'TEA_LOUNGE' THEN 4 ELSE NULL END,
    NULL,
    CASE
        WHEN r.row_letter = 'C' AND c.col_no <= 3 THEN 'SOLD'
        WHEN r.row_letter = 'D' AND c.col_no = 4 THEN 'LOCKED'
        ELSE 'AVAILABLE'
    END,
    'STANDARD'
FROM event_zones z
JOIN events e ON e.id = z.event_id
CROSS JOIN (VALUES ('C'), ('D'), ('E')) AS r(row_letter)
CROSS JOIN generate_series(1, 8) AS c(col_no)
WHERE z.zone_name = 'STANDARD'
  AND e.ticket_map_type IN ('SEAT_MAP', 'TEA_LOUNGE')
  AND NOT EXISTS (
      SELECT 1 FROM event_seats s WHERE s.zone_id = z.id AND s.seat_code = r.row_letter || c.col_no
  );
