# Use case

```mermaid
flowchart LR
  Tester --> UC1[Chạy kiểm thử tab hiện tại]
  Tester --> UC2[Xem dashboard và lọc lịch sử]
  Tester --> UC3[Xem báo cáo và xuất file]
  Tester --> UC4[Cấu hình ngưỡng hiệu năng]
  Tester --> UC5[Xóa lịch sử]
```

**UC1 — Chạy kiểm thử:** Tester mở website được phép, bật popup, xác nhận checkbox, chọn nhóm/mức, bắt đầu. Hệ thống inject collector, chạy rule, tùy chọn probe HTTP và axe-core, lưu kết quả.

**UC2 — Dashboard:** Tester mở trang extension, xem thống kê và bảng lịch sử.

**UC3 — Báo cáo:** Tester lọc finding, tải JSON/HTML hoặc in.

**Ngoại lệ:** URL không HTTP(S), tab `chrome://`, từ chối quyền, hủy phiên, service worker dừng giữa chừng.
