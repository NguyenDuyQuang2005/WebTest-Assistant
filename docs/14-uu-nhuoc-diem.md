# Đánh giá ưu điểm, nhược điểm

## Ưu điểm

- Rule engine thuần TypeScript, dễ viết unit test và đối chiếu expected result.
- Phân biệt rõ Failed và Không thể xác minh (CORS, quyền, timeout, 401/403).
- Không yêu cầu host permission mọi website lúc cài đặt.
- Báo cáo HTML được escape, giảm rủi ro XSS khi mở file.
- Có fixture âm tính (thiếu title/alt/label) chứ không chỉ trang “đẹp”.

## Nhược điểm

- Phụ thuộc tab đang mở; không crawl nhiều URL.
- Service worker có thể làm gián đoạn phiên dài.
- axe-core inject MAIN world có thể thất bại trên trang CSP nghiêm ngặt.
- Hiệu năng chỉ là Navigation Timing tại thời điểm chạy, không phải lab profile.
- Playwright e2e không load bản extension unpacked trong mọi môi trường CI/headless.
