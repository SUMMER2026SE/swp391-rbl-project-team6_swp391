# Pronunciation Practice (Shadowing) Result Panel

Trang luyện shadowing tại `routes/student.shadowing.practice.$videoId.tsx` hiển thị bảng **Kết Quả Luyện Tập** cho mỗi câu. Từ phiên bản này, panel kết quả đã được tái cấu trúc để giảm chiều dài và không cần cuộn trang.

---

## Cấu trúc mới

### Phần luôn hiển thị (compact)
- Điểm tổng dạng **mini circular gauge**
- Số sao (1–5)
- Nhãn xếp loại (Xuất sắc / Rất tốt / Khá tốt / Trung bình / Cần cố gắng)
- Tóm tắt **Độ chính xác** & **Độ trùng khớp**
- Nút **Chi tiết** ↔ **Thu gọn**

### Phần chi tiết (bấm "Chi tiết" để mở)
- Hai thẻ metrics chi tiết (Độ chính xác / Độ trùng khớp) với thanh tiến trình
- **So sánh phát âm chi tiết**: câu mẫu vs phát âm của bạn (từng chữ tô màu xanh/đỏ)
- **Gợi ý luyện tập** (từ AI)
- **Lịch sử luyện tập** cho câu hiện tại (điểm các lần trước)

---

## Hành vi nút bấm

| Trạng thái ban đầu | Nút hiển thị | Bấm vào sẽ |
|--------------------|--------------|-------------|
| Lần đầu vào / sau khi chấm | **Chi tiết →** | Mở rộng tất cả phần chi tiết |
| Đang mở rộng | **← Thu gọn** | Thu gọn lại về chỉ điểm tổng |

---

## Lợi ích

- **Không cần cuộn trang** để xem điểm sau khi AI chấm xong — phần compact hiển thị đủ thông tin quan trọng ngay trong card.
- **Truy cập nhanh lịch sử**: 1 cú bấm là thấy các lần luyện tập trước đó cho cùng câu.
- **Giữ nguyên logic chấm điểm**: code AI evaluation không đổi, chỉ thay đổi layout hiển thị.

---

## State liên quan

State React mới được thêm:

```ts
const [showResultDetails, setShowResultDetails] = useState(false);
```

State này điều khiển ẩn/hiện các block: metrics cards, transcript comparison, suggestions, history.

---

## Tùy chỉnh nhanh

Mở file `midori-fe/src/routes/student.shadowing.practice.$videoId.tsx`, tìm:

```tsx
<button
  onClick={() => setShowResultDetails((v) => !v)}
  ...
>
```

Đổi:
- `text-[10px]` → `text-xs` nếu muốn nút to hơn
- Thêm `defaultChecked` / `defaultValue` tương ứng nếu muốn mở sẵn chi tiết (đặt `useState(true)`)

---
