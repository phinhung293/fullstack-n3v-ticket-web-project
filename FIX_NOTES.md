# Fix chạy backend phân quyền/JWT

## Lỗi gốc
Backend dừng khi khởi động vì thiếu cấu hình `jwt.secret`:

```text
Could not resolve placeholder 'jwt.secret' in value "${jwt.secret}"
```

## Đã sửa
- Thêm default `jwt.secret` đủ dài trong `backend/src/main/resources/application.properties`.
- Thêm file `backend/src/main/resources/application-local.properties` để chạy local.
- Cho phép override bằng biến môi trường `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET`.
- Sửa `EmailService`: nếu chưa cấu hình Gmail App Password thì backend vẫn chạy, OTP sẽ in ra console để test.
- Sửa kiểm tra OTP tránh lỗi null `codeExpiry`.
- Thêm `backend/fix_auth_schema.sql` để cập nhật DB cũ đã import từ SQL nhưng chưa có `roles`, `role_id`, `avatar_url`, `verification_code`.

## Cách chạy
1. Mở `backend/src/main/resources/application-local.properties`.
2. Sửa 3 dòng database theo máy bạn hoặc theo Supabase:

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/n3vticket
spring.datasource.username=postgres
spring.datasource.password=123456
```

3. Nếu dùng Supabase, lấy JDBC connection string trong Project Settings > Database rồi sửa thành dạng:

```properties
spring.datasource.url=jdbc:postgresql://aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require
spring.datasource.username=postgres.xxxxxxxxxxxxxxxxxxxx
spring.datasource.password=mat_khau_database_cua_ban
```

4. Chạy backend:

```bash
cd backend
./mvnw spring-boot:run
```

Windows PowerShell:

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

5. Nếu database báo thiếu bảng/cột `roles`, `role_id`, chạy file:

```text
backend/fix_auth_schema.sql
```

trong Supabase SQL Editor hoặc DBeaver.

## API test nhanh

Register:

```http
POST http://localhost:8080/api/auth/register
Content-Type: application/json

{
  "fullName": "Admin Test",
  "email": "admin@test.com",
  "phone": "0900000001",
  "password": "Admin@123"
}
```

Login:

```http
POST http://localhost:8080/api/auth/login
Content-Type: application/json

{
  "email": "admin@test.com",
  "password": "Admin@123"
}
```

Profile:

```http
GET http://localhost:8080/api/users/profile
Authorization: Bearer <accessToken>
```
