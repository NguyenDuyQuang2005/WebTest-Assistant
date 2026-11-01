# Phạm vi và giới hạn

## Trong phạm vi

- Website HTTP/HTTPS do người dùng mở và xác nhận được phép kiểm thử.
- Kiểm tra tĩnh/DOM, phân loại liên kết, HEAD/GET hạn chế, a11y cơ bản + axe-core tùy mức, Navigation Timing.
- Lưu trữ cục bộ trên máy người dùng.

## Ngoài phạm vi

- Quét lỗ hổng, brute force, bypass CAPTCHA/đăng nhập.
- Gửi form, đăng ký, thanh toán.
- Chứng nhận WCAG, ISO hay hiệu năng production-grade (Lighthouse/WebPageTest).
- Trang `chrome://`, Web Store, `file://`.

## Giới hạn kỹ thuật Chrome

Service worker không giữ biến lâu dài. Fetch liên kết ngoài cần quyền host tùy chọn. CORS không được diễn giải thành liên kết hỏng.
