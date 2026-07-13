-- ============================================================
-- V6 - Seed sample data
-- ============================================================

------------------------------------------------------------
-- CATEGORY
------------------------------------------------------------

INSERT INTO categories(name, slug, description, icon_url)
SELECT
    'Âm nhạc',
    'am-nhac',
    'Các sự kiện âm nhạc',
    'https://cdn-icons-png.flaticon.com/512/3659/3659784.png'
    WHERE NOT EXISTS (
    SELECT 1 FROM categories WHERE slug='am-nhac'
);

INSERT INTO categories(name, slug, description, icon_url)
SELECT
    'Thể thao',
    'the-thao',
    'Các sự kiện thể thao',
    'https://cdn-icons-png.flaticon.com/512/857/857455.png'
    WHERE NOT EXISTS (
    SELECT 1 FROM categories WHERE slug='the-thao'
);

INSERT INTO categories(name, slug, description, icon_url)
SELECT
    'Nghệ thuật',
    'nghe-thuat',
    'Các sự kiện nghệ thuật',
    'https://cdn-icons-png.flaticon.com/512/2917/2917992.png'
    WHERE NOT EXISTS (
    SELECT 1 FROM categories WHERE slug='nghe-thuat'
);

------------------------------------------------------------
-- EVENT 1
------------------------------------------------------------

INSERT INTO events
(
    category_id,
    name,
    description,
    thumbnail_url,
    banner_url,
    venue_name,
    address,
    city,
    start_time,
    end_time,
    sale_start_time,
    sale_end_time,
    ticket_map_type,
    status,
    created_by
)
SELECT
    (
        SELECT id
        FROM categories
        WHERE slug='am-nhac'
    ),
    'Sky Music Festival 2026',
    'Đại nhạc hội ngoài trời quy tụ nhiều ca sĩ nổi tiếng.',
    'https://images.unsplash.com/photo-1501386761578-eac5c94b800a',
    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f',
    'Nhà thi đấu Phú Thọ',
    '219 Lý Thường Kiệt',
    'TP. Hồ Chí Minh',
    '2026-09-20 19:00:00',
    '2026-09-20 23:00:00',
    '2026-07-20 00:00:00',
    '2026-09-19 23:59:59',
    'SEAT_MAP',
    'PUBLISHED',
    2
    WHERE NOT EXISTS (
    SELECT 1
    FROM events
    WHERE name='Sky Music Festival 2026'
);

------------------------------------------------------------
-- EVENT 2
------------------------------------------------------------

INSERT INTO events
(
    category_id,
    name,
    description,
    thumbnail_url,
    banner_url,
    venue_name,
    address,
    city,
    start_time,
    end_time,
    sale_start_time,
    sale_end_time,
    ticket_map_type,
    status,
    created_by
)
SELECT
    (
        SELECT id
        FROM categories
        WHERE slug='the-thao'
    ),
    'Giải Marathon Hà Nội',
    'Giải chạy thường niên dành cho mọi lứa tuổi.',
    'https://images.unsplash.com/photo-1552674605-db6ffd4facb5',
    'https://images.unsplash.com/photo-1517649763962-0c623066013b',
    'Hồ Gươm',
    'Đinh Tiên Hoàng',
    'Hà Nội',
    '2026-08-15 05:30:00',
    '2026-08-15 11:00:00',
    '2026-06-01 00:00:00',
    '2026-08-14 23:59:59',
    'ZONE',
    'PUBLISHED',
    2
    WHERE NOT EXISTS (
    SELECT 1
    FROM events
    WHERE name='Giải Marathon Hà Nội'
);

------------------------------------------------------------
-- EVENT 3
------------------------------------------------------------

INSERT INTO events
(
    category_id,
    name,
    description,
    thumbnail_url,
    banner_url,
    venue_name,
    address,
    city,
    start_time,
    end_time,
    sale_start_time,
    sale_end_time,
    ticket_map_type,
    status,
    created_by
)
SELECT
    (
        SELECT id
        FROM categories
        WHERE slug='nghe-thuat'
    ),
    'Đêm Ballet Quốc Gia',
    'Đêm biểu diễn Ballet đặc sắc.',
    'https://images.unsplash.com/photo-1503095396549-807759245b35',
    'https://images.unsplash.com/photo-1516280440614-37939bbacd81',
    'Nhà hát Thành phố',
    '07 Công Trường Lam Sơn',
    'TP. Hồ Chí Minh',
    '2026-10-01 19:30:00',
    '2026-10-01 22:00:00',
    '2026-08-01 00:00:00',
    '2026-09-30 23:59:59',
    'TEA_LOUNGE',
    'PUBLISHED',
    2
    WHERE NOT EXISTS (
    SELECT 1
    FROM events
    WHERE name='Đêm Ballet Quốc Gia'
);

------------------------------------------------------------
-- EVENT ZONES
------------------------------------------------------------

INSERT INTO event_zones
(
    event_id,
    zone_name,
    description,
    total_capacity,
    sold_count,
    price,
    display_order,
    active
)
SELECT
    id,
    'VIP',
    'Khu VIP',
    200,
    20,
    2500000,
    1,
    TRUE
FROM events
WHERE NOT EXISTS (
    SELECT 1
    FROM event_zones
    WHERE event_id = events.id
      AND zone_name = 'VIP'
);

INSERT INTO event_zones
(
    event_id,
    zone_name,
    description,
    total_capacity,
    sold_count,
    price,
    display_order,
    active
)
SELECT
    id,
    'STANDARD',
    'Khu Standard',
    500,
    120,
    1500000,
    2,
    TRUE
FROM events
WHERE NOT EXISTS (
    SELECT 1
    FROM event_zones
    WHERE event_id = events.id
      AND zone_name = 'STANDARD'
);

INSERT INTO event_zones
(
    event_id,
    zone_name,
    description,
    total_capacity,
    sold_count,
    price,
    display_order,
    active
)
SELECT
    id,
    'ECONOMY',
    'Khu Economy',
    1000,
    350,
    800000,
    3,
    TRUE
FROM events
WHERE NOT EXISTS (
    SELECT 1
    FROM event_zones
    WHERE event_id = events.id
      AND zone_name = 'ECONOMY'
);