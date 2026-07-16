-- Nâng cấp bảng notifications đã tồn tại từ migration V1
-- để hỗ trợ Notification Database + WebSocket realtime.

-- =========================================================
-- 1. Đổi cột content thành message
-- =========================================================

ALTER TABLE notifications
    RENAME COLUMN content TO message;


-- =========================================================
-- 2. Thêm các cột mới
-- =========================================================

ALTER TABLE notifications
    ADD COLUMN target_url VARCHAR(500);

ALTER TABLE notifications
    ADD COLUMN reference_type VARCHAR(50);

ALTER TABLE notifications
    ADD COLUMN reference_id BIGINT;

ALTER TABLE notifications
    ADD COLUMN deduplication_key VARCHAR(255);

ALTER TABLE notifications
    ADD COLUMN read_at TIMESTAMP WITH TIME ZONE;


-- =========================================================
-- 3. Chuẩn hóa các cột bắt buộc
-- =========================================================

ALTER TABLE notifications
    ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE notifications
    ALTER COLUMN type SET NOT NULL;

ALTER TABLE notifications
    ALTER COLUMN is_read SET NOT NULL;

ALTER TABLE notifications
    ALTER COLUMN is_read SET DEFAULT FALSE;

ALTER TABLE notifications
    ALTER COLUMN created_at SET NOT NULL;

ALTER TABLE notifications
    ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;


-- =========================================================
-- 4. Thêm khóa chống thông báo trùng
-- =========================================================

ALTER TABLE notifications
    ADD CONSTRAINT uk_notifications_deduplication_key
        UNIQUE (deduplication_key);


-- =========================================================
-- 5. Tạo các index
-- =========================================================

CREATE INDEX idx_notifications_user_created_at
    ON notifications(user_id, created_at DESC);

CREATE INDEX idx_notifications_user_is_read
    ON notifications(user_id, is_read);

CREATE INDEX idx_notifications_reference
    ON notifications(reference_type, reference_id);

CREATE INDEX idx_notifications_type
    ON notifications(type);