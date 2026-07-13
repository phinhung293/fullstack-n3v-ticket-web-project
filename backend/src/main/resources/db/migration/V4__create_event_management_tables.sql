-- =========================================================
-- Bang "events" da ton tai san (tu truoc khi module Quan ly su kien duoc code)
-- voi 1 vai cot legacy khong khop voi entity Event.java hien tai:
--   - "title": NOT NULL, nhung Event.java dung cot "name" de luu ten su kien,
--     khong co gi ghi gia tri cho "title" -> insert bi loi vi pham NOT NULL.
--   - "address": NOT NULL, nhung EventCreateRequest cho phep de trong (khong
--     bat buoc @NotBlank) -> se loi tuong tu neu ai do tao su kien khong nhap address.
--
-- Giai phap: no long rang buoc NOT NULL cho 2 cot nay (KHONG xoa cot, chi
-- cho phep null), vi entity hien tai khong dung "title" va cho phep "address"
-- la tuy chon. Neu sau nay can dung lai cot "title" (VD hien thi rieng),
-- co the map them field "title" vao Event.java thay vi sua migration nay.
-- =========================================================

ALTER TABLE events ALTER COLUMN title DROP NOT NULL;
ALTER TABLE events ALTER COLUMN address DROP NOT NULL;