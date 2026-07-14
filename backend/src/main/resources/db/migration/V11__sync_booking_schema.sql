-- Drop the old foreign key referencing the legacy 'seats' table
ALTER TABLE order_items DROP CONSTRAINT IF EXISTS order_items_seat_id_fkey;

-- Add the new foreign key referencing the active 'event_seats' table
ALTER TABLE order_items ADD CONSTRAINT order_items_seat_id_fkey FOREIGN KEY (seat_id) REFERENCES event_seats(id);
