# MIDORI — Hướng dẫn setup local

## 1. Tổng quan

| Thành phần | Công nghệ | Port |
|---|---|---|
| Backend | Spring Boot 3.3.1 + Java 17 | 8080 |
| Frontend | TanStack Start + React + Vite | 8081 |
| Database | Supabase PostgreSQL (SSL required) | — |
| Mail | Gmail SMTP (STARTTLS port 587) | — |
| Login | Email/password + Google OAuth (popup) | — |

**Repo:** `https://github.com/SUMMER2026SE/swp391-rbl-project-team6_swp391.git`

---

## 2. Yêu cầu môi trường

| Công cụ | Phiên bản tối thiểu | Lệnh kiểm tra |
|---|---|---|
| Git | 2.30+ | `git -v` |
| Java JDK | **17** | `java -version` |
| Maven | 3.8+ | `mvn -v` |
| Node.js | 18+ | `node -v` |
| npm | 9+ | `npm -v` |
| IDE khuyên dùng | IntelliJ IDEA (backend), Cursor / VS Code (frontend) | — |

---

## 3. Clone & Checkout

```powershell
git clone https://github.com/SUMMER2026SE/swp391-rbl-project-team6_swp391.git
cd swp391-rbl-project-team6_swp391

# Branch ổn định
git checkout main
# Hoặc branch feature hiện tại
git checkout feat-dat/auth-profile-local-integration
```

---

## 4. Setup Backend

### 4.1. Kiểm tra Java & Maven

```powershell
cd midori-be
java -version
mvn -v
```

### 4.2. Tạo file environment variables

**File thật — không commit:**

```powershell
cd midori-be
copy-item .env.example .env
```

**Mở `midori-be/.env`, thay các placeholder (tất cả các biến đều có comment trong file):**

| Variable | Thay bằng | Nguồn |
|---------|-----------|--------|
| `DATABASE_URL` | Connection string Supabase | Supabase Dashboard > Settings > Connection String |
| `DATABASE_USERNAME` | `postgres.xxx` | Supabase Dashboard |
| `DATABASE_PASSWORD` | Mật khẩu DB | Hỏi team leader |
| `JWT_SECRET` | Secret key (tối thiểu 32 ký tự) | Tự tạo |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | Hỏi team leader |
| `SPRING_MAIL_USERNAME` | Gmail gửi OTP | Dùng Gmail của team |
| `SPRING_MAIL_PASSWORD` | Gmail App Password (16 ký tự) | Hỏi team leader hoặc tự tạo |
| `APP_MAIL_FROM` | Cùng `SPRING_MAIL_USERNAME` | |

### 4.3. Cấu hình Gmail App Password

1. Bật **2-Step Verification** trên Google Account.
2. Vào **Google Account > Security > App passwords**.
3. Chọn app: **Mail**, device: **Other (Custom name)**.
4. Copy mật khẩu 16 ký tự, dán vào `SPRING_MAIL_PASSWORD` trong `midori-be/.env`.

> **Lưu ý:** Không dùng mật khẩu Gmail thường. App Password là bắt buộc.

### 4.4. Cấu hình Supabase

Vào **Supabase Dashboard > Settings > Connection String**, lấy:

- `host` — ví dụ: `aws-1-ap-southeast-1.pooler.supabase.com` (pooler)
- `port` — 5432 (direct) hoặc 6543 (pooler), lấy đúng từ dashboard
- `username` — ví dụ: `postgres.xxx`
- `password` — DB password
- Thêm `?sslmode=require` vào cuối connection string

> **Lưu ý:** Nếu gặp `HikariPool - Connection is not available`, giảm `maximum-pool-size` xuống **5** trong `application.yml` và restart backend.

---

## 5. Setup Frontend

### 5.1. Cài đặt dependencies

```powershell
cd midori-fe
npm install
```

### 5.2. Tạo file env local

```powershell
cd midori-fe
Copy-Item .env.example .env.local
```

**Mở `.env.local`, thay placeholder:**

```
VITE_API_BASE_URL=http://localhost:8080/api
VITE_GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
VITE_SUPABASE_AVATAR_BUCKET=avatars
```

### 5.3. Cấu hình Google OAuth (nếu dùng Google Login)

Dự án dùng **Google Identity Services popup** (không có redirect callback backend).

Trong **Google Cloud Console > APIs & Services > Credentials > OAuth 2.0 Client IDs**:

- Thêm `http://localhost:8081` vào **Authorized JavaScript origins**.

Không cần thêm redirect URI.

---

## 6. Lệnh chạy project

### Backend

```powershell
cd midori-be
mvn spring-boot:run
```

**Dấu hiệu chạy thành công:**
```
HikariPool-1 - Start completed
Tomcat started on port 8080
Started MidoriBeApplication in X.XXX seconds
```

Backend API: **http://localhost:8080**

### Frontend

```powershell
cd midori-fe
npm run dev -- --port 8081
```

**Dấu hiệu chạy thành công:**
```
VITE ready in XXX ms
Local: http://localhost:8081/
```

Frontend: **http://localhost:8081**

---

## 7. Test nhanh sau khi chạy

| # | Luồng test | Kỳ vọng |
|---|---|---|
| 1 | Register Student | Nhận OTP qua Gmail |
| 2 | Password yếu (abc123) | Hiện lỗi / checklist rõ ràng |
| 3 | Password mạnh (ví dụ `@Datnguyen123`) | Đăng ký thành công |
| 4 | Verify email bằng OTP — `POST /api/auth/verify-email` body: `{"token":"..."}` | `emailVerified=true` |
| 5 | Resend OTP — `POST /api/auth/resend-verification` body: `{"email":"..."}` | Gửi OTP mới nếu email chưa verify |
| 6 | Login thường | Nhận JWT, chuyển trang dashboard |
| 7 | Google Login | Popup OAuth, tạo account tự động nếu chưa có |
| 8 | Xem / Edit Profile | Hiển thị và lưu thông tin |
| 9 | Upload avatar | Upload lên Supabase Storage |
| 10 | Change password — trùng current password | Bị chặn, hiện lỗi |
| 11 | Change password — hợp lệ | Đổi thành công |
| 12 | Student dashboard trên mobile | Chart không warning, layout responsive |
| 13 | Profile page trên mobile | Không bị bottom nav che |

---

## 8. Lỗi thường gặp

| Lỗi | Nguyên nhân | Cách sửa |
|---|---|---|
| `Unknown lifecycle phase ".run.profiles=local"` | PowerShell hiểu sai flag | Dùng `"-Dspring-boot.run.profiles=local"` (dấu ngoặc kép bao ngoài) |
| `HikariPool - Connection is not available` | Supabase hết session | Giảm `maximum-pool-size: 5`, restart backend |
| DB connection failed | Sai host/port/password hoặc thiếu `sslmode=require` | Kiểm tra Supabase connection string |
| Không nhận OTP Gmail | Email vào Spam/Promotions, hoặc App Password sai | Kiểm tra Spam. Dùng **port 587 STARTTLS**, kiểm tra App Password 16 ký tự. |
| `CORS 403` từ frontend 8081 | Backend chưa chạy hoặc origin chưa whitelist | Kiểm tra `SecurityConfig` có `http://localhost:8081` |
| `GET /api/auth/me` trả 403 | Chưa login hoặc token hết hạn | Kiểm tra `localStorage` có `auth_token`, đã verify email chưa |
| `origin not allowed` trên Google Login | Chưa thêm localhost vào Google Cloud Console | Thêm `http://localhost:8081` vào **Authorized JavaScript origins** |
| Vite chạy nhầm port | Port 8081 đã bị chiếm | `netstat -aon \| findstr :8081` rồi kill process, hoặc chạy `npm run dev -- --port 8081` |
| Lỗi `gserp-scrapper.js` trên Chrome | Extension Chrome conflict | Mở tab ẩn danh hoặc tắt extension |

---

## 9. Quy tắc bảo mật khi commit

**TUYỆT ĐỐI KHÔNG commit các file sau:**

```
midori-be/.env                                         # secret DB + Gmail + JWT + API keys
midori-fe/.env.local                                   # API keys + Supabase keys
get_otp.py                                             # file test tạm
```

**Kiểm tra trước khi commit:**

```powershell
git status --short
```

**NÊN commit:**

```
midori-be/.env.example                                  # template placeholder
midori-fe/.env.example                                  # template placeholder
midori-be/src/main/resources/application.yml              # chỉ có ${ENV_VAR}, không secret
```
