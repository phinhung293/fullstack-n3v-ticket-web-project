ALTER TABLE order_items ADD COLUMN event_zone_id BIGINT REFERENCES event_zones(id);
