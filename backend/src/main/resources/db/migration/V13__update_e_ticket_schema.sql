-- Bổ sung liên kết vé điện tử với module sự kiện hiện tại

ALTER TABLE e_tickets
    ADD COLUMN IF NOT EXISTS event_id BIGINT;

ALTER TABLE e_tickets
    ADD COLUMN IF NOT EXISTS event_zone_id BIGINT;

ALTER TABLE e_tickets
    ADD COLUMN IF NOT EXISTS seat_id BIGINT;

ALTER TABLE e_tickets
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE
    DEFAULT CURRENT_TIMESTAMP;

-- Tạo khóa ngoại nếu chưa tồn tại

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_e_tickets_event'
    ) THEN
ALTER TABLE e_tickets
    ADD CONSTRAINT fk_e_tickets_event
        FOREIGN KEY (event_id)
            REFERENCES events(id);
END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_e_tickets_event_zone'
    ) THEN
ALTER TABLE e_tickets
    ADD CONSTRAINT fk_e_tickets_event_zone
        FOREIGN KEY (event_zone_id)
            REFERENCES event_zones(id);
END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_e_tickets_event_seat'
    ) THEN
ALTER TABLE e_tickets
    ADD CONSTRAINT fk_e_tickets_event_seat
        FOREIGN KEY (seat_id)
            REFERENCES event_seats(id);
END IF;
END
$$;

-- Tạo index để tìm vé nhanh hơn

CREATE INDEX IF NOT EXISTS idx_e_tickets_user_id
    ON e_tickets(user_id);

CREATE INDEX IF NOT EXISTS idx_e_tickets_event_id
    ON e_tickets(event_id);

CREATE INDEX IF NOT EXISTS idx_e_tickets_event_zone_id
    ON e_tickets(event_zone_id);

CREATE INDEX IF NOT EXISTS idx_e_tickets_seat_id
    ON e_tickets(seat_id);

CREATE INDEX IF NOT EXISTS idx_e_tickets_qr_code_hash
    ON e_tickets(qr_code_hash);

CREATE INDEX IF NOT EXISTS idx_e_tickets_status
    ON e_tickets(status);