
-- 1. Bảng Người dùng & Phân quyền
CREATE TABLE users (
                       id BIGSERIAL PRIMARY KEY,
                       email VARCHAR(255) UNIQUE NOT NULL,
                       password_hash VARCHAR(255) NOT NULL,
                       full_name VARCHAR(100) NOT NULL,
                       phone VARCHAR(20) UNIQUE,
                       role VARCHAR(20) DEFAULT 'ROLE_USER',
                       status VARCHAR(20) DEFAULT 'ACTIVE',
                       created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                       updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Bảng Đơn vị tổ chức (Organizer)
CREATE TABLE organizers (
                            id BIGSERIAL PRIMARY KEY,
                            name VARCHAR(255) NOT NULL,
                            logo_url VARCHAR(500),
                            description TEXT,
                            phone VARCHAR(20),
                            email VARCHAR(255),
                            website VARCHAR(255),
                            created_by BIGINT REFERENCES users(id),
                            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Bảng Danh mục Sự kiện
CREATE TABLE categories (
                            id BIGSERIAL PRIMARY KEY,
                            name VARCHAR(100) UNIQUE NOT NULL,
                            description TEXT
);

-- 4. Bảng Sự kiện chính (Đã nâng cấp Location & Organizer)
CREATE TABLE events (
                        id BIGSERIAL PRIMARY KEY,
                        organizer_id BIGINT REFERENCES organizers(id),
                        category_id BIGINT REFERENCES categories(id),
                        title VARCHAR(255) NOT NULL,
                        description TEXT,
                        venue_name VARCHAR(255) NOT NULL,
                        address VARCHAR(500) NOT NULL,
                        city VARCHAR(100),
                        province VARCHAR(100),
                        latitude DECIMAL(10, 8),
                        longitude DECIMAL(11, 8),
                        status VARCHAR(20) DEFAULT 'DRAFT',
                        created_by BIGINT REFERENCES users(id),
                        updated_by BIGINT REFERENCES users(id),
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Bảng Hình ảnh Sự kiện (Gallery & Thumbnail)
CREATE TABLE event_images (
                              id BIGSERIAL PRIMARY KEY,
                              event_id BIGINT REFERENCES events(id) ON DELETE CASCADE,
                              url VARCHAR(500) NOT NULL,
                              is_thumbnail BOOLEAN DEFAULT FALSE,
                              display_order INT DEFAULT 0
);

-- 6. Bảng Banner Trang chủ
CREATE TABLE banners (
                         id BIGSERIAL PRIMARY KEY,
                         title VARCHAR(255),
                         image_url VARCHAR(500) NOT NULL,
                         link_url VARCHAR(500),
                         priority INT DEFAULT 0,
                         is_active BOOLEAN DEFAULT TRUE,
                         created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Bảng Lịch diễn
CREATE TABLE shows (
                       id BIGSERIAL PRIMARY KEY,
                       event_id BIGINT REFERENCES events(id) ON DELETE CASCADE,
                       show_date DATE NOT NULL,
                       start_time TIME NOT NULL,
                       end_time TIME,
                       status VARCHAR(20) DEFAULT 'OPEN',
                       created_by BIGINT REFERENCES users(id),
                       created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Bảng Cấu hình Hạng Vé / Combo
CREATE TABLE ticket_classes (
                                id BIGSERIAL PRIMARY KEY,
                                show_id BIGINT REFERENCES shows(id) ON DELETE CASCADE,
                                name VARCHAR(100) NOT NULL,
                                type VARCHAR(20) NOT NULL,
                                price DECIMAL(15, 2) NOT NULL DEFAULT 0,
                                min_buy INT DEFAULT 1,
                                max_buy INT DEFAULT 10,
                                perks TEXT,
                                color_code VARCHAR(10),
                                capacity INT NOT NULL,
                                available INT NOT NULL,
                                created_by BIGINT REFERENCES users(id),
                                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Bảng Khu vực Sơ đồ (Hỗ trợ cấu hình JSON cho UI)
CREATE TABLE seat_sections (
                               id BIGSERIAL PRIMARY KEY,
                               show_id BIGINT REFERENCES shows(id) ON DELETE CASCADE,
                               name VARCHAR(50) NOT NULL,
                               json_layout JSONB, -- Lưu cấu trúc SVG, transform, rotation từ Frontend
                               created_by BIGINT REFERENCES users(id),
                               created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. Bảng Chỗ ngồi chi tiết (Có tọa độ X, Y)
CREATE TABLE seats (
                       id BIGSERIAL PRIMARY KEY,
                       section_id BIGINT REFERENCES seat_sections(id) ON DELETE CASCADE,
                       ticket_class_id BIGINT REFERENCES ticket_classes(id),
                       row_no VARCHAR(10) NOT NULL,
                       seat_no INT NOT NULL,
                       pos_x DECIMAL(10, 2), -- Tọa độ render trên Canvas/Grid
                       pos_y DECIMAL(10, 2), -- Tọa độ render trên Canvas/Grid
                       status VARCHAR(20) DEFAULT 'AVAILABLE',
                       hold_expires_at TIMESTAMP WITH TIME ZONE,
                       UNIQUE (section_id, row_no, seat_no)
);

-- 11. Bảng Voucher / Khuyến mãi
CREATE TABLE vouchers (
                          id BIGSERIAL PRIMARY KEY,
                          code VARCHAR(50) UNIQUE NOT NULL,
                          description TEXT,
                          discount_percent INT DEFAULT 0,
                          max_discount_amount DECIMAL(15, 2),
                          minimum_order DECIMAL(15, 2) DEFAULT 0,
                          usage_limit INT,
                          used_count INT DEFAULT 0,
                          start_at TIMESTAMP WITH TIME ZONE,
                          expires_at TIMESTAMP WITH TIME ZONE,
                          is_active BOOLEAN DEFAULT TRUE,
                          created_by BIGINT REFERENCES users(id)
);

-- 12. Bảng Đơn hàng (Cập nhật order_code)
CREATE TABLE orders (
                        id BIGSERIAL PRIMARY KEY,
                        order_code VARCHAR(50) UNIQUE NOT NULL, -- Mã giao dịch (VD: OD20260701001)
                        user_id BIGINT REFERENCES users(id),
                        voucher_id BIGINT REFERENCES vouchers(id),
                        total_amount DECIMAL(15, 2) NOT NULL,
                        discount_amount DECIMAL(15, 2) DEFAULT 0,
                        final_amount DECIMAL(15, 2) NOT NULL,
                        status VARCHAR(20) DEFAULT 'PENDING',
                        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 13. Bảng Chi tiết Đơn hàng
CREATE TABLE order_items (
                             id BIGSERIAL PRIMARY KEY,
                             order_id BIGINT REFERENCES orders(id) ON DELETE CASCADE,
                             ticket_class_id BIGINT REFERENCES ticket_classes(id),
                             seat_id BIGINT REFERENCES seats(id),
                             quantity INT NOT NULL DEFAULT 1,
                             unit_price DECIMAL(15, 2) NOT NULL,
                             subtotal DECIMAL(15, 2) NOT NULL
);

-- 14. Bảng Giao dịch Thanh toán (Payments)
CREATE TABLE payments (
                          id BIGSERIAL PRIMARY KEY,
                          order_id BIGINT REFERENCES orders(id) ON DELETE CASCADE,
                          provider VARCHAR(50) NOT NULL, -- Momo, VNPay, Stripe...
                          transaction_id VARCHAR(100), -- Mã GD từ đối tác
                          status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, SUCCESS, FAILED
                          amount DECIMAL(15, 2) NOT NULL,
                          response_data JSONB, -- Lưu payload JSON trả về từ cổng thanh toán để đối soát
                          paid_at TIMESTAMP WITH TIME ZONE,
                          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 15. Bảng Vé Điện Tử (Cập nhật Check-in)
CREATE TABLE e_tickets (
                           id BIGSERIAL PRIMARY KEY,
                           ticket_code VARCHAR(50) UNIQUE NOT NULL, -- Mã vé trực quan (VD: TKT2026001)
                           order_item_id BIGINT REFERENCES order_items(id),
                           user_id BIGINT REFERENCES users(id),
                           show_id BIGINT REFERENCES shows(id),
                           qr_code_hash VARCHAR(255) UNIQUE NOT NULL,
                           status VARCHAR(20) DEFAULT 'ISSUED',
                           checked_in_at TIMESTAMP WITH TIME ZONE,
                           checked_in_by BIGINT REFERENCES users(id), -- Nhân viên nào quét mã
                           created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 16. Bảng Đánh giá (Reviews)
CREATE TABLE reviews (
                         id BIGSERIAL PRIMARY KEY,
                         event_id BIGINT REFERENCES events(id) ON DELETE CASCADE,
                         user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
                         rating INT CHECK (rating BETWEEN 1 AND 5),
                         comment TEXT,
                         created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 17. Bảng Sự kiện Yêu thích (Favorites)
CREATE TABLE favorites (
                           user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
                           event_id BIGINT REFERENCES events(id) ON DELETE CASCADE,
                           created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                           PRIMARY KEY (user_id, event_id)
);

-- 18. Bảng Thông báo (Notifications)
CREATE TABLE notifications (
                               id BIGSERIAL PRIMARY KEY,
                               user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
                               title VARCHAR(255) NOT NULL,
                               content TEXT NOT NULL,
                               type VARCHAR(50), -- ORDER_SUCCESS, EVENT_REMINDER...
                               is_read BOOLEAN DEFAULT FALSE,
                               created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 19. Bảng Audit Logs (Theo dõi hành động Admin)
CREATE TABLE audit_logs (
                            id BIGSERIAL PRIMARY KEY,
                            user_id BIGINT REFERENCES users(id), -- Người thực hiện hành động
                            action VARCHAR(50) NOT NULL, -- CREATE, UPDATE, DELETE
                            table_name VARCHAR(50) NOT NULL,
                            record_id BIGINT NOT NULL,
                            old_values JSONB,
                            new_values JSONB,
                            ip_address VARCHAR(45),
                            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);