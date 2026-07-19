# Dev Server Controls

Các PowerShell script giúp bạn **khởi động lại nhanh** Backend (port 8080) và Frontend (port 8081) khi đang phát triển.

> **Lưu ý**: Các script này chỉ dành cho môi trường **local development** trên Windows (PowerShell 5+). Không commit thư mục `scripts/dev/` nếu team sử dụng WSL/Mac/Linux.

---

## Scripts có sẵn

| Script | Chức năng |
|--------|-----------|
| `kill-all.ps1` | Kill mọi process đang chiếm port 8080 + 8081 + các tiến trình `node` còn sót |
| `restart-backend.ps1` | Kill port 8080 → mở terminal mới chạy `run-backend-local.ps1` |
| `restart-frontend.ps1` | Kill port 8081 (+ node) → mở terminal mới chạy `run-frontend.ps1` |
| `restart-all.ps1` | Kill cả 8080 + 8081 → mở 2 terminal mới cho BE và FE |
| `dev-menu.ps1` | Menu tương tác, chọn 1-5 để chạy các lệnh trên |

---

## Cách dùng nhanh nhất

Mở PowerShell tại thư mục gốc project (`D:\swp1\swp391-rbl-project-team6_swp391`) và chạy:

```powershell
.\scripts\dev\dev-menu.ps1
```

Sau đó chọn một số trong menu:

```
============================================================
  MIDORI - Dev Server Controls
============================================================

  [1] Kill ALL (BE 8080 + FE 8081 + node)
  [2] Restart Backend  (kill 8080 -> start)
  [3] Restart Frontend (kill 8081 -> start)
  [4] Restart BOTH (kill all -> start both)
  [5] Show port status (8080 / 8081)
  [0] Exit
```

> **Tip**: Pin `dev-menu.ps1` ra taskbar để bấm nhanh.

---

## Chạy trực tiếp từng lệnh

Nếu không muốn dùng menu, có thể chạy thẳng từng script:

```powershell
# Restart backend (kill 8080 + chạy lại Spring Boot)
.\scripts\dev\restart-backend.ps1

# Restart frontend (kill 8081 + chạy lại Vite)
.\scripts\dev\restart-frontend.ps1

# Kill tất cả (không tự khởi động lại)
.\scripts\dev\kill-all.ps1
```

Mỗi script sẽ **mở một cửa sổ PowerShell mới** để chạy server, nên script chính sẽ trả về ngay và bạn có thể tiếp tục làm việc trong cửa sổ cũ.

---

## Cơ chế hoạt động

### Phát hiện process theo port

Script dùng `Get-NetTCPConnection -LocalPort <port> -State Listen` để tìm **PID đang giữ port**, sau đó `Stop-Process -Force` chúng.

```powershell
$conn = Get-NetTCPConnection -LocalPort 8080 -State Listen
$pid  = $conn.OwningProcess
Stop-Process -Id $pid -Force
```

### Kill các tiến trình node còn sót

Khi restart frontend, script cũng kill tất cả tiến trình `node.exe` đang chạy (Vite dev server hay để lại worker process). Điều này đảm bảo port 8081 được giải phóng hoàn toàn.

### Khởi động trong cửa sổ mới

`Start-Process powershell -ArgumentList "-NoExit", "-File", "<path-to-script>"` sẽ mở một terminal mới và chạy script backend/frontend hiện có (`run-backend-local.ps1`, `run-frontend.ps1`). Terminal mới không tự đóng nhờ `-NoExit` nên bạn theo dõi logs Spring Boot / Vite ngay tại đó.

---

## Xử lý lỗi thường gặp

### "Port 8080 is free" → nhưng vẫn không chạy được

Có thể Java/Maven chưa kịp giải phóng socket. Đợi vài giây rồi chạy lại `restart-backend.ps1`.

### Cửa sổ mới bật lên nhưng đóng ngay

Kiểm tra:
1. `application-local.yml` đã tồn tại trong `midori-be/src/main/resources/` chưa (xem [LOCAL_SETUP.md](../LOCAL_SETUP.md))
2. Database Supabase còn live và các secret trong `application-local.yml` đúng
3. Mở cửa sổ PowerShell thủ công và chạy lại `run-backend-local.ps1` để xem log chi tiết

### Frontend mở port khác (8082, 8083…)

Khi port 8081 đang bận nhưng chưa kịp giải phóng, Vite sẽ tự nhảy sang port kế tiếp. Đợi khoảng 5 giây hoặc dùng `restart-frontend.ps1` để ép về 8081.

### "Access is denied" khi Stop-Process

Mở PowerShell với quyền Administrator hoặc đảm bảo không có process nào đang debug attach vào Java/Node.

---

## Lưu ý khi debug log

| Bạn muốn | Mở cửa sổ nào |
|----------|----------------|
| Xem log Spring Boot | Cửa sổ backend (terminal mở bởi `restart-backend.ps1`) |
| Xem log Vite/HMR | Cửa sổ frontend (terminal mở bởi `restart-frontend.ps1`) |
| Backend log lỗi → sửa file Java → reload | Ctrl+C trong cửa sổ backend → chạy `.\scripts\dev\restart-backend.ps1` (Spring Boot DevTools cũng tự reload nếu bật) |
| Frontend sửa code → reload | **Không cần restart**, Vite HMR tự reload |

---

## Phím tắt gợi ý

Tạo shortcut trên desktop trỏ tới:

```
powershell.exe -NoExit -File "D:\swp1\swp391-rbl-project-team6_swp391\scripts\dev\dev-menu.ps1"
```

Bấm đúp để mở menu bất kỳ lúc nào.

---
