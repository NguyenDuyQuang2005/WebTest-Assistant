# Hướng dẫn sử dụng WebTest Assistant

Tài liệu này dành cho người dùng cuối (sinh viên demo, giảng viên nghiệm thu) và mô tả thao tác thực tế trên Chrome. Chi tiết kiến trúc nằm ở các file `docs/07`–`docs/10`.

## 1. Điều kiện trước khi dùng

| Mục | Yêu cầu |
|---|---|
| Trình duyệt | Google Chrome (hoặc Chromium tương thích Manifest V3) |
| Node.js | 20 trở lên (để build) |
| Quyền kiểm thử | Chỉ kiểm website bạn sở hữu hoặc được cấp phép |
| Tab mục tiêu | `http://` hoặc `https://` — không dùng `chrome://`, Web Store, PDF nội bộ |

Cài đặt phụ thuộc và dựng gói:

```bash
npm install
npm run icons
npm run build
```

Kết quả nằm trong thư mục `dist`.

## 2. Tải extension vào Chrome (Load unpacked)

1. Mở `chrome://extensions`.
2. Bật **Developer mode** (góc trên bên phải).
3. Chọn **Load unpacked**.
4. Chọn thư mục `dist` của dự án (không chọn thư mục gốc nếu chưa build).
5. Ghim icon **WebTest Assistant** trên thanh tiện ích.

Sau mỗi lần `npm run build`, quay lại `chrome://extensions` và bấm **Reload** trên thẻ tiện ích.

Chế độ phát triển (tùy chọn): `npm run dev`, rồi Reload khi Vite báo đã biên dịch.

## 3. Chạy kiểm thử từ popup (luồng chính)

Popup luôn kiểm **tab đang mở**, không tự mở website hộ bạn.

1. Mở website mục tiêu trên một tab Chrome.
2. Bấm icon WebTest Assistant.
3. Kiểm tra dòng URL: nếu báo không hợp lệ hoặc trang bị hạn chế, đổi tab.
4. Chọn nhóm kiểm thử:
   - **DOM:** title, heading, alt, label, ID trùng, form, liên kết trống.
   - **Liên kết:** phân loại và dò HTTP có giới hạn.
   - **Biểu mẫu:** thuộc tính, bắt buộc, validation HTML — **không gửi form**.
   - **Khả năng truy cập:** quy tắc cơ bản + axe-core ở mức Tiêu chuẩn/Kỹ.
   - **Hiệu năng:** Navigation Timing trên tab; không bịa số nếu API trống.
5. Chọn mức **Cơ bản / Tiêu chuẩn / Kỹ**.
6. Đánh dấu:
   - Xác nhận phạm vi được phép kiểm thử.
   - Xác nhận không gửi dữ liệu thật / không vượt đăng nhập hay CAPTCHA.
7. (Tùy chọn) Cho phép dò liên kết ngoài.
8. Bấm **Bắt đầu**. Quyền host tùy chọn được xin **trực tiếp từ thao tác click** (popup/Dashboard), không xin khi chỉ mở popup và không xin từ service worker. Cho phép trên hộp thoại Chrome nếu muốn dò HTTP; nếu từ chối, phiên vẫn chạy với `activeTab`, kiểm tra liên kết có thể ra Không thể xác minh.
9. Có thể **Hủy phiên** khi đang chạy.
10. Bấm **Dashboard** để xem lịch sử, hoặc **Hướng dẫn** để mở trang trợ giúp trong Dashboard.

Nút Bắt đầu bị vô hiệu khi thiếu xác nhận, URL không HTTP/HTTPS, trang cấm inject, hoặc chưa chọn nhóm nào.

## 4. Dashboard

Mở bằng nút **Dashboard** trên popup (dùng `chrome.runtime.getURL`, không hardcode ID). Sau khi build, file thực tế là `dist/src/dashboard/index.html`. Có thể mở:

- Popup → Dashboard
- `chrome://extensions` → thẻ tiện ích → **Extension options**
- URL dạng `chrome-extension://<id>/src/dashboard/index.html` (thay `<id>` bằng ID trên `chrome://extensions`, không copy ID mẫu từ tài liệu cũ)

Sau mỗi lần sửa mã: `npm run build` rồi **Reload** tiện ích trước khi mở lại Dashboard.

| Mục menu | Việc làm được |
|---|---|
| Tổng quan | Thống kê, lọc thời gian / website / trạng thái, danh sách site, lịch sử, vào báo cáo |
| Phiên mới | Nhập URL **khớp origin tab đang active**, chọn nhóm/mức, xác nhận, bắt đầu/hủy |
| Báo cáo | Chi tiết finding, lọc, xuất JSON/HTML, In/PDF, xóa một phiên |
| Cấu hình | Ngưỡng TTFB / DOMContentLoaded / Load, số liên kết, timeout, xóa hết lịch sử |
| Hướng dẫn | Bản hướng dẫn trong giao diện |

**Lưu ý Dashboard:** extension đọc tab đang hoạt động của cửa sổ. Nếu URL nhập khác origin tab, hãy chuyển sang đúng trang rồi mở lại Dashboard, hoặc dùng popup.

### 4.1. Xuất báo cáo

- **JSON:** file văn bản để nộp hoặc xử lý tiếp.
- **HTML:** mở bằng trình duyệt; nội dung đã escape để giảm rủi ro XSS.
- **In / PDF:** mở HTML rồi dùng hộp thoại in của Chrome → **Save as PDF**.

### 4.2. Xóa dữ liệu

- Xóa một phiên trên trang báo cáo (có `confirm`).
- Xóa toàn bộ lịch sử trong Cấu hình (có `confirm`).
- Không lưu cookie, mật khẩu, token.

## 5. Cách đọc trạng thái

| Trạng thái | Ý nghĩa |
|---|---|
| Passed | Quy tắc có bằng chứng đạt |
| Failed | Quy tắc có bằng chứng không đạt |
| Warning | Cần rà thủ công, chưa kết luận lỗi chắc chắn |
| Skipped | Không chạy hoặc không có đối tượng |
| Không thể xác minh | CORS, timeout, 401/403, thiếu quyền, API không có dữ liệu |

**Công thức tỷ lệ thành công**

`Passed / (Passed + Failed + Warning) × 100`

Skipped và Không thể xác minh **không** tính Passed. Mẫu số = 0 → **N/A**.

axe-core (phiên bản ghi trong README, giấy phép MPL-2.0) **không** chứng minh website tuân thủ toàn bộ WCAG.

## 6. Website fixture để demo trên máy

Trong thư mục dự án:

```bash
npm run fixtures
```

Mặc định lắng nghe `http://127.0.0.1:4173`.

| URL | Mục đích demo |
|---|---|
| `/valid.html` | Trang tương đối đầy đủ |
| `/missing-title.html` | Thiếu title |
| `/missing-alt.html` | Ảnh thiếu alt |
| `/form-no-label.html` | Form thiếu label |
| `/invalid-link.html` | Liên kết URL không hợp lệ |
| `/slow` | Trang trả chậm |
| `/http-error` | HTTP 500 |
| `/unreachable` | Kết nối bị cắt |

Chỉ dùng fixture trên máy local; không coi đây là website sản xuất.

## 7. Kiểm thử chính sản phẩm (dành cho báo cáo kỹ thuật)

```bash
npm run typecheck
npm run lint
npm test
npx playwright install chromium
npm run test:e2e
```

Kết quả lệnh thật được ghi tại [13-ket-qua-kiem-thu.md](13-ket-qua-kiem-thu.md). Phần chưa chạy phải ghi *chưa thực hiện*, không bịa số.

## 8. Sự cố thường gặp

| Hiện tượng | Hướng xử lý |
|---|---|
| Popup báo trang bị hạn chế | Đổi sang tab HTTP/HTTPS thông thường |
| Dashboard báo URL không khớp tab | Mở đúng website, giữ cửa sổ đó, mở lại Dashboard |
| Nhiều liên kết “Không thể xác minh” | Bình thường với CORS; xin quyền host nếu dò ngoài origin |
| Phiên running biến thành lỗi sau khi đóng Chrome | Service worker MV3 bị dừng; phiên quá hạn được đánh dấu khi khởi động lại |
| Giao diện cũ sau khi sửa code | `npm run build` + Reload extension |
| Load unpacked không thấy icon | Đảm bảo đã chọn `dist` và đã `npm run icons` |

## 9. Việc công cụ cố ý không làm

- Không quét lỗ hổng, brute force, vượt CAPTCHA hay đăng nhập.
- Không tự gửi form, đăng ký, thanh toán.
- Không theo redirect sang origin ngoài phạm vi đã xác nhận.
- Không inject script lấy từ website để thực thi.
- Không tuyên bố “website đạt chất lượng 100%” chỉ từ kiểm tra tự động.
