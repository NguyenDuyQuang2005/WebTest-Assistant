# Kết quả kiểm thử thực tế

Ghi nhận sau lần sửa lỗi user gesture / Dashboard (Windows, Node v24.15.0). Không bịa số liệu.

## Lệnh đã chạy

| Lệnh | Kết quả |
|---|---|
| `npm run typecheck` | Thành công (exit 0) |
| `npm run lint` | Thành công (exit 0) |
| `npm test` | 14 file, 53 test passed |
| `npm run build` | Thành công; có `dist/src/dashboard/index.html` |
| `npm run test:e2e` | 8 passed (5.3s) sau `npx playwright install chromium` |
| `npm audit` | 11 lỗ hổng (3 moderate, 6 high, 2 critical) — **chưa vá an toàn**, xem README |

## Unit / integration (Vitest 3.2.7)

```
Test Files  14 passed (14)
     Tests  53 passed (53)
  Duration  3.44s
```

Thêm hồi quy: `tests/unit/permissions.test.ts`, `errors.test.ts`, `dashboard-path.test.ts`.

## Playwright

```
8 passed (5.3s)
```

## Đường dẫn trong `dist/manifest.json`

Đã kiểm `Test-Path`: popup HTML, dashboard HTML, service worker, icons, `vendor/axe.min.js` đều tồn tại.

## Kiểm thử thủ công trên Chrome

| Hạng mục | Kết quả |
|---|---|
| Load unpacked `dist` | Chưa thực hiện trong môi trường agent |
| User gesture / `permissions.request` trên popup | Chưa xác minh runtime Chrome; đã sửa luồng trong mã |
| Mở Dashboard | File đã có trong `dist`; chưa mở tay trên Chrome |

Sau khi Load unpacked: Reload tiện ích, mở `http://127.0.0.1:4173/valid.html`, bấm Bắt đầu, cho phép quyền nếu Chrome hỏi, rồi bấm Dashboard.
