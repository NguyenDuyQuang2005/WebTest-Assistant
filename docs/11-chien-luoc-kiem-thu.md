# Chiến lược kiểm thử

Kiểm thử **chính WebTest Assistant**, không chỉ website người dùng.

| Lớp | Công cụ | Đối tượng |
|---|---|---|
| Unit | Vitest | URL validator, stats, DOM rules, link outcome, history, report escape |
| Integration | Vitest + jsdom | Collector + rules, khởi tạo phiên, message/storage giả, xuất file |
| E2E fixture | Playwright | Trang hợp lệ, thiếu title/alt/label, link hỏng, HTTP 500, chậm, 404 |
| Thủ công | Chrome Load unpacked | Popup, dashboard, quyền, tab `chrome://` |

Kỹ thuật: dương tính, âm tính, biên (URL rỗng, 0 finding → N/A), ngoại lệ (tab bị cấm, CORS → not_verifiable).
