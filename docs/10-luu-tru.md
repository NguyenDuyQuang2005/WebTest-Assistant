# Cấu trúc lưu trữ

`chrome.storage.local`:

| Khóa | Nội dung |
|---|---|
| `wta.history` | Mảng `TestRun` (tối đa `maxHistoryItems`, cắt nếu vượt ~4.5MB) |
| `wta.settings` | Ngưỡng hiệu năng, timeout, concurrency, số liên kết |
| `wta.activeRunId` | Dọn khi xóa lịch sử |

Không lưu cookie, mật khẩu, token, HTML thô của trang. Evidence là chuỗi đã cắt ngắn (URL, tên trường, excerpt text).

Kiểu chính: `TestFinding`, `TestRun`, `TestStats`, `PageSnapshot`, `UserSettings` trong `src/shared/types.ts`.
