# Danh sách test case

Kết quả thực tế được cập nhật trong `13-ket-qua-kiem-thu.md` sau khi chạy lệnh.

| Test Case ID | Mục tiêu | Tiền điều kiện | Các bước | Dữ liệu | Kết quả mong đợi | Kết quả thực tế | Trạng thái | Ưu tiên |
|---|---|---|---|---|---|---|---|---|
| TC-U-01 | URL https hợp lệ | — | Gọi `validateHttpUrl` | `https://example.com/path` | `ok=true` | Xem vitest | — | Cao |
| TC-U-02 | URL rỗng | — | Gọi validator | `"   "` | `ok=false` | — | — | Cao |
| TC-U-03 | chrome:// bị từ chối | — | Validator + restricted | `chrome://extensions` | Không hợp lệ / restricted | — | — | Cao |
| TC-U-04 | Phân loại link | page origin example.com | `classifyLink` | `/a`, `https://other`, `#x`, `javascript:` | internal/external/anchor/special invalid | — | — | Cao |
| TC-S-01 | Công thức tỷ lệ | 2P 1F 1W 1S 1NV | `computeStats` | 6 findings | rate=50, total=6 | — | — | Cao |
| TC-S-02 | N/A khi không eligible | chỉ skipped/NV | `computeStats` | 2 findings | `successRate=null`, format N/A | — | — | Cao |
| TC-R-01 | Thiếu title → failed | snapshot title rỗng | `runDomRules` | title="" | DOM-001 failed | — | — | Cao |
| TC-R-02 | Ảnh thiếu alt | img không alt | `runDomRules` | 1 ảnh | DOM-003 failed | — | — | Cao |
| TC-R-03 | Trùng id | duplicateIds=["a"] | `runDomRules` | — | DOM-006 failed | — | — | Trung bình |
| TC-L-01 | CORS không failed | mapHttpOutcome | error CORS | not_verifiable | — | — | Cao |
| TC-L-02 | HTTP 404 failed | mapHttpOutcome | 404 | failed | — | — | Cao |
| TC-L-03 | 403 not_verifiable | mapHttpOutcome | 403 | not_verifiable | — | — | Cao |
| TC-H-01 | Lưu/đọc lịch sử | memoryStore | save + load | 1 run | length=1 | — | — | Cao |
| TC-H-02 | Stale running | running > 3 phút | `markStaleRuns` | — | lifecycle=error | — | — | Trung bình |
| TC-P-01 | Escape XSS HTML | finding chứa `<img onerror>` | `serializeReportHtml` | script | không còn thẻ thô | — | — | Cao |
| TC-I-01 | Khởi tạo thiếu consent | canStart | owned=false | ok=false | — | — | Cao |
| TC-I-02 | Collector jsdom | DOM thiếu title/alt | collect + rules | HTML mẫu | DOM-001/003 failed | — | — | Cao |
| TC-I-03 | Message GET_RUN | store có run | fakeRuntime | id đúng/sai | ok true/false | — | — | Trung bình |
| TC-E-01 | Fixture hợp lệ | server 4173 | Playwright goto /valid | — | title Trang hợp lệ | — | — | Cao |
| TC-E-02 | Fixture thiếu title | /missing-title | evaluate collector | — | DOM-001 failed | — | — | Cao |
| TC-E-03 | Fixture thiếu alt | /missing-alt | collector | — | DOM-003 failed | — | — | Cao |
| TC-E-04 | Form thiếu label | /form-no-label | collector | — | DOM-004 & A11Y-002 failed | — | — | Cao |
| TC-E-05 | Link không hợp lệ | /invalid-link | collector | — | DOM-008 failed | — | — | Cao |
| TC-E-06 | HTTP 500 | /http-error | request.get | — | status 500 | — | — | Trung bình |
| TC-E-07 | Trang chậm | /slow | goto | — | >1s và title đúng | — | — | Trung bình |
| TC-E-08 | Không truy cập | /no-such-page | request.get | — | 404 | — | — | Trung bình |
| TC-M-01 | Tab chrome:// | Chrome thật | Load unpacked, mở chrome:// | — | Thông báo không inject | Chưa chạy trên Chrome GUI | Chưa thực hiện | Cao |
| TC-M-02 | Xuất JSON/HTML GUI | Có 1 phiên | Bấm xuất trên dashboard | — | Tải file | Chưa chạy GUI | Chưa thực hiện | Cao |
