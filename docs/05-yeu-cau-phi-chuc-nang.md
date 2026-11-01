# Yêu cầu phi chức năng

- TypeScript strict, tránh `any`.
- UI tiếng Việt, responsive, trạng thái loading/empty/error.
- Chống XSS: escape HTML khi xuất báo cáo, không `dangerouslySetInnerHTML` với dữ liệu trang.
- Không lưu bí mật website.
- Concurrency liên kết mặc định 3, timeout 8s, giới hạn số liên kết theo mức.
- Build bằng Vite thành unpacked extension.
- Thời gian một phiên phụ thuộc số liên kết; service worker có thể ngủ — phiên treo được đánh dấu lỗi.
