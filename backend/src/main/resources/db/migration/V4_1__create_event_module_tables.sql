-- ============================================================
-- V4.1 - Bổ sung schema module Quản lý sự kiện.
--
-- LÝ DO FILE NÀY TỒN TẠI:
-- Trước đây "event_zones", "event_seats" và một số cột của "events"/
-- "categories" được tạo/sửa THỦ CÔNG qua Supabase SQL Editor (không đi
-- qua Flyway) trong lúc phát triển module Quản lý sự kiện. V5 (add
-- seat_tier) giả định "event_seats" đã tồn tại - đúng với DB thật lúc
-- đó, nhưng KHÔNG đúng nếu replay Flyway từ đầu trên DB sạch (V1->V4
-- không hề tạo event_zones/event_seats). File này tạo bù đúng phần đó,
-- để pipeline V1->V9 chạy được từ một DB rỗng.
--
-- Toàn bộ cột dưới đây lấy từ 2 nguồn đã xác nhận CHÍNH XÁC với DB thật,
-- không đoán:
--   - events/categories: log Hibernate SELECT (ddl-auto=validate đã pass
--     với các cột này trên DB thật trước khi reset).
--   - event_zones/event_seats: information_schema.columns query trực tiếp.
-- ============================================================

------------------------------------------------------------
-- CATEGORIES: bổ sung cột slug/icon_url/created_at
-- (V1 chỉ có id, name, description)
------------------------------------------------------------

ALTER TABLE categories
    ADD COLUMN IF NOT EXISTS slug VARCHAR(150),
    ADD COLUMN IF NOT EXISTS icon_url VARCHAR(500),
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uq_categories_slug'
    ) THEN
        ALTER TABLE categories ADD CONSTRAINT uq_categories_slug UNIQUE (slug);
    END IF;
END $$;

------------------------------------------------------------
-- EVENTS: bổ sung các cột module sự kiện còn thiếu.
-- venue_name, address, city, status, category_id, created_by,
-- created_at, updated_at đã có sẵn từ V1 (bảng legacy) - không đụng vào.
------------------------------------------------------------

ALTER TABLE events
    ADD COLUMN IF NOT EXISTS name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS thumbnail_url VARCHAR(500),
    ADD COLUMN IF NOT EXISTS banner_url VARCHAR(500),
    ADD COLUMN IF NOT EXISTS start_time TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS end_time TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS sale_start_time TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS sale_end_time TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS ticket_map_type VARCHAR(20);

------------------------------------------------------------
-- EVENT_ZONES: bảng mới hoàn toàn, chưa từng có trong Flyway.
-- Cột/nullable lấy đúng từ information_schema bạn đã gửi.
------------------------------------------------------------

CREATE TABLE IF NOT EXISTS event_zones (
    id             BIGSERIAL PRIMARY KEY,
    event_id       BIGINT REFERENCES events(id) ON DELETE CASCADE,
    zone_name      VARCHAR(150),
    description    VARCHAR(500),
    total_capacity INTEGER,
    sold_count     INTEGER NOT NULL DEFAULT 0,
    price          NUMERIC(15, 2),
    display_order  INTEGER NOT NULL DEFAULT 0,
    active         BOOLEAN NOT NULL DEFAULT TRUE
);

------------------------------------------------------------
-- EVENT_SEATS: bảng mới hoàn toàn. seat_tier KHÔNG thêm ở đây,
-- để V5__add_seat_tier_to_event_seats.sql chạy sau tiếp tục thêm
-- đúng như thiết kế ban đầu (V5 dùng ADD COLUMN IF NOT EXISTS nên
-- vẫn an toàn dù chạy sau file này).
------------------------------------------------------------

CREATE TABLE IF NOT EXISTS event_seats (
    id           BIGSERIAL PRIMARY KEY,
    zone_id      BIGINT REFERENCES event_zones(id) ON DELETE CASCADE,
    seat_type    VARCHAR(20),
    seat_row     VARCHAR(10),
    seat_column  INTEGER,
    seat_code    VARCHAR(20),
    capacity     INTEGER,
    price        NUMERIC(15, 2),
    status       VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE'
);
