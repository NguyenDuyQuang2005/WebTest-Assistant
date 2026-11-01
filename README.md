# WebTest Assistant

**Chrome Extension hỗ trợ kiểm thử chất lượng website** — thu thập thông tin từ tab đang mở, chạy các quy tắc kiểm tra và tổng hợp kết quả thành báo cáo.

WebTest Assistant tập trung vào DOM, liên kết, biểu mẫu, khả năng truy cập và một số chỉ số hiệu năng. Đây là công cụ rà soát ban đầu, **không phải trình quét lỗ hổng xâm nhập** và không thay thế kiểm thử thủ công. Chỉ sử dụng trên website bạn sở hữu hoặc được phép kiểm thử.

## Link demo và báo cáo

| Nội dung | Liên kết |
|---|---|
| Video Demo |...................  |
| Báo cáo |https://drive.google.com/drive/folders/1Ytq2_c4LtbRA7hyAzAnw1eqzSkpoems1?usp=sharing |



## Giới thiệu

Tiện ích được xây dựng theo Manifest V3. Người dùng chọn nhóm kiểm tra và mức quét, xác nhận phạm vi, sau đó có thể theo dõi tiến trình, xem lịch sử và xuất báo cáo. Mỗi finding có mã quy tắc, trạng thái, mức độ, bằng chứng và khuyến nghị.

### Tính năng chính

**DOM**

- Kiểm tra tiêu đề trang, heading, thuộc tính alt, nhãn trường nhập, tên nút/liên kết, ID và href.

**Liên kết**

- Phân loại liên kết nội bộ, bên ngoài, anchor và đặc biệt.
- Có thể kiểm tra HTTP khi được cấp quyền; CORS, thiếu quyền, timeout hoặc 401–403 được ghi là **Không thể xác minh**, không tự kết luận liên kết bị hỏng.

**Biểu mẫu**

- Rà soát trường bắt buộc, `name`, khả năng nhận diện và một số thuộc tính HTML.
- Không tự gửi biểu mẫu, đăng ký tài khoản hay thực hiện giao dịch.

**Khả năng truy cập**

- Có quy tắc kiểm tra cơ bản và tích hợp axe-core ở mức quét Tiêu chuẩn/Kỹ.
- Kết quả tự động chỉ hỗ trợ rà soát, **không chứng minh tuân thủ WCAG**.

**Hiệu năng và báo cáo**

- Ghi nhận một số chỉ số do Navigation Timing trên tab cung cấp; không tự tạo số liệu khi trình duyệt không có dữ liệu.
- Lưu lịch sử cục bộ, lọc kết quả và xuất JSON/HTML hoặc in thành PDF.

## Công nghệ sử dụng

| Thành phần | Công nghệ |
|---|---|
| Nền tảng | Chrome Extension Manifest V3 |
| Giao diện | React 19, TypeScript 5.9, Tailwind CSS 3 |
| Build | Vite 6, `@crxjs/vite-plugin` |
| Unit/integration | Vitest, jsdom |
| E2E | Playwright và website fixture cục bộ |
| Khả năng truy cập | axe-core 4.14 |
| Lưu trữ | `chrome.storage.local` |

## Cấu trúc thư mục

```text
src/
├── background/       # Service worker và axe runner
├── content/          # Thu thập snapshot DOM
├── testing/          # Rule engine, kiểm tra liên kết và hiệu năng
├── storage/          # Lịch sử Chrome storage và bộ nhớ giả cho test
├── reports/          # Xuất báo cáo JSON/HTML
├── popup/            # Giao diện chạy kiểm thử nhanh
└── dashboard/        # Dashboard, lịch sử và chi tiết báo cáo
tests/                # Unit, integration và E2E
fixtures/sites/       # Website mẫu phục vụ kiểm thử
scripts/              # Công cụ build và fixture server
docs/                 # Đặc tả, test case, kết quả và hướng dẫn
```

## Kiến trúc và luồng xử lý

```text
Popup / Dashboard → Service worker → DOM Collector → Snapshot
                                  ├→ Rule Engine / axe-core
                                  ├→ Link Probe
                                  └→ chrome.storage.local → Dashboard / JSON / HTML
```

Popup và Dashboard gửi yêu cầu đến service worker. Worker kiểm tra phạm vi/consent, tạo phiên, gọi collector để lấy snapshot giới hạn từ tab, rồi điều phối các nhóm quy tắc. Kết quả được lưu cục bộ để xem lại hoặc xuất báo cáo. Rule engine tách khỏi Chrome API để có thể kiểm thử độc lập; HTML báo cáo escape nội dung finding trước khi render.

Collector không lưu HTML toàn trang. Theo đặc tả dự án, dữ liệu thu thập có giới hạn tối đa 200 liên kết, 100 ảnh và 120 control; lịch sử cũng có giới hạn dung lượng.

## Cài đặt và chạy

### Yêu cầu

- Node.js 20 trở lên.
- Google Chrome/Chromium có hỗ trợ Manifest V3.

### Cài dependencies và build

```bash
npm install
npm run icons
npm run build
```

### Cài tiện ích vào Chrome

1. Mở `chrome://extensions`.
2. Bật **Developer mode**.
3. Chọn **Load unpacked** và chọn thư mục `dist` trong project.
4. Ghim icon WebTest Assistant trên thanh tiện ích nếu muốn truy cập nhanh.

Sau khi build phiên bản mới, bấm **Reload** tại trang Extensions.

### Chạy thử nhanh

1. Mở một website HTTP/HTTPS mà bạn được phép kiểm thử.
2. Bấm icon extension, chọn nhóm và mức kiểm tra.
3. Xác nhận phạm vi kiểm thử và xác nhận không gửi dữ liệu thật.
4. Có thể bật dò liên kết ngoài; Chrome có thể yêu cầu quyền host.
5. Bấm **Bắt đầu**, theo dõi tiến trình hoặc hủy phiên.
6. Mở **Dashboard** để xem lịch sử, chi tiết finding và xuất báo cáo.

Hướng dẫn đầy đủ: [docs/16-huong-dan-su-dung.md](docs/16-huong-dan-su-dung.md).

### Website fixture để demo

Chạy máy chủ fixture:

```bash
npm run fixtures
```

Mở `http://127.0.0.1:4173/valid.html` rồi chạy extension. Một số đường dẫn mẫu khác: `/missing-title.html`, `/missing-alt.html`, `/form-no-label.html`, `/invalid-link.html`, `/slow` và `/http-error`.

### Chế độ phát triển

```bash
npm run dev
```

Sau khi thay đổi mã nguồn, build lại và bấm **Reload** trên `chrome://extensions`.

## Quyền Chrome

| Quyền | Mục đích |
|---|---|
| `activeTab` | Truy cập tab người dùng chủ động chọn để kiểm thử. |
| `scripting` | Chạy collector DOM và axe-core khi bắt đầu phiên. |
| `storage` | Lưu lịch sử, cấu hình và kết quả tóm tắt cục bộ; không lưu cookie, mật khẩu hoặc token. |
| `tabs` | Dashboard đọc URL tab đang hoạt động để gắn phiên với trang mục tiêu. |
| Host permission tùy chọn | Chỉ yêu cầu khi người dùng chọn bắt đầu kiểm tra liên kết cần quyền truy cập. |

> Extension không inject vào trang `chrome://`, `chrome-extension://` hoặc Chrome Web Store. Service worker Manifest V3 có thể bị dừng; trạng thái phiên được lưu cục bộ và phiên `running` quá 3 phút có thể được đánh dấu lỗi khi khôi phục.

## Kết quả kiểm thử

Các số liệu dưới đây được ghi trong [docs/13-ket-qua-kiem-thu.md](docs/13-ket-qua-kiem-thu.md), không phải kết quả vừa chạy lại trong mỗi lần mở project.

| Hạng mục | Kết quả được ghi nhận |
|---|---:|
| Typecheck | Thành công |
| Lint | Thành công |
| Vitest | 53/53 test, 14 file |
| Playwright E2E | 8/8 test |
| Build | Thành công; tạo thư mục `dist` |
| Kiểm thử thủ công Chrome | Chưa xác minh đầy đủ các luồng quyền và thao tác giao diện |

Chạy lại các bộ kiểm thử:

```bash
npm run typecheck
npm run lint
npm test
npx playwright install chromium
npm run test:e2e
```

Tỷ lệ thành công của phiên quét được tính như sau:

```text
Passed / (Passed + Failed + Warning) × 100
```

`Skipped` và `Không thể xác minh` không được tính là Passed. Nếu mẫu số bằng 0, giao diện hiển thị `N/A`. Kết quả quét website thật phụ thuộc trang và thời điểm; không đại diện cho toàn bộ website.

### Phạm vi kiểm thử tự động

| Nhóm | Nội dung kiểm tra | Test tiêu biểu |
|---|---|---|
| URL và quyền | URL HTTP/HTTPS, URL rỗng, trang bị hạn chế, xác nhận quyền | `tests/unit/url.test.ts`, `tests/unit/permissions.test.ts` |
| Rule engine và DOM | Title, alt, heading, nhãn, ID, thống kê finding | `tests/unit/dom-rules.test.ts`, `tests/unit/engine.test.ts`, `tests/integration/collector.test.ts` |
| Liên kết | Phân loại URL, HTTP status, CORS và trường hợp không xác minh | `tests/unit/links.test.ts` |
| Storage và phiên | Lịch sử, stale run, message, bắt đầu/hủy phiên | `tests/unit/history.test.ts`, `tests/integration/messaging.test.ts`, `tests/integration/start-run.test.ts` |
| Báo cáo và lỗi | Serialize JSON/HTML, escape nội dung, xử lý lỗi | `tests/unit/reports.test.ts`, `tests/integration/export-and-errors.test.ts` |
| Website fixture | Trang hợp lệ/thiếu title/alt/label, link lỗi, HTTP 500, trang chậm | `tests/e2e/fixtures.spec.ts` |

Danh sách đầy đủ: [docs/12-test-case.md](docs/12-test-case.md). Dự án chưa có báo cáo line/branch coverage hoặc mutation score nên README không công bố tỷ lệ coverage.

### Phiên quét minh họa trên Nike Việt Nam

Báo cáo đồ án ghi nhận một phiên chạy trên `https://www.nike.com/vn/` ở mức Standard. Đây là kết quả quan sát của một lần quét trang chủ, không phải đánh giá toàn bộ website.

| Kết quả | Số liệu |
|---|---:|
| Tổng findings | 38 |
| Passed / Failed / Warning | 19 / 10 / 7 |
| Skipped / Không thể xác minh | 1 / 1 |
| Tỷ lệ thành công | 52.8% |
| TTFB / DOMContentLoaded / Load | 1214 / 5229 / 13081 ms (đều vượt ngưỡng cấu hình lần chạy) |
| LCP | Không thể xác minh từ Performance API trên tab đó |

Một số finding cần rà soát gồm tên truy cập của nút, ID trùng, khai báo form, thứ tự heading và cấu trúc ARIA/list. Kết quả tự động là gợi ý có bằng chứng để kiểm tra tiếp, không tự kết luận website vi phạm toàn bộ tiêu chuẩn.

Ảnh báo cáo cũng ghi nhận DOM-001 (title), DOM-002 (h1), DOM-003 (alt ảnh) và DOM-004 (nhãn trường) là Passed; DOM-005 (tên truy cập nút/liên kết) và DOM-006 (ID trùng) là Failed. Các chỉ số hiệu năng trên thuộc lần tải cụ thể đó, chịu ảnh hưởng mạng, cache và thiết bị.

## Nhóm chức năng trong giao diện

| Khu vực | Chức năng |
|---|---|
| Popup | Chọn tab/URL, nhóm và mức kiểm tra; xác nhận phạm vi; bắt đầu hoặc hủy phiên |
| Dashboard tổng quan | Xem thống kê và lịch sử các phiên |
| Báo cáo phiên | Lọc findings theo trạng thái/mức độ; xem evidence và recommendation |
| Xuất báo cáo | Tải JSON, mở HTML hoặc in/lưu PDF qua trình duyệt |
| Cấu hình | Điều chỉnh ngưỡng hiệu năng và giới hạn kiểm tra |

## Giới hạn và an toàn

- Chỉ kiểm tra tab hiện tại; không crawl toàn bộ website hoặc vượt đăng nhập, CAPTCHA, CSRF hay tường lửa.
- Không gửi biểu mẫu hoặc thực hiện giao dịch thật.
- Không theo redirect sang origin ngoài phạm vi đã xác nhận.
- Số liên kết và kích thước lịch sử có giới hạn.
- Link probe phụ thuộc CORS, quyền host và phản hồi máy chủ; kết quả không xác minh được phải được xem riêng.
- Kiểm tra khả năng truy cập tự động không thay thế đánh giá thủ công hoặc chứng nhận WCAG.
- Hiệu năng lấy từ API của trình duyệt, không phải phép đo lab có kiểm soát.

## Đánh giá và hướng phát triển

**Ưu điểm:** rule engine tách khỏi Chrome API; finding có mã, mức độ, bằng chứng và khuyến nghị; phân biệt `failed`, `warning`, `skipped` và `not_verifiable`; có unit/integration/E2E fixture; dữ liệu được lưu cục bộ.

**Hướng phát triển:** bổ sung kiểm thử GUI Chrome cho luồng quyền, tab bị hạn chế và hủy phiên; thêm so sánh giữa các lần chạy; cân nhắc Side Panel, hàng đợi nhiều tab có xác nhận phạm vi, đa ngôn ngữ và tích hợp Lighthouse phù hợp chính sách quyền.

## Tài liệu liên quan

- [Hướng dẫn sử dụng](docs/16-huong-dan-su-dung.md)
- [Chiến lược kiểm thử](docs/11-chien-luoc-kiem-thu.md)
- [Danh sách test case](docs/12-test-case.md)
- [Kết quả kiểm thử](docs/13-ket-qua-kiem-thu.md)





cần chạy lại `npm audit` trên lockfile hiện tại để xác nhận trạng thái mới. Không dùng `npm audit fix --force` nếu chưa đánh giá thay đổi major và khả năng tương thích.
