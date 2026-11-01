export function HelpPage() {
  return (
    <article className="mx-auto max-w-3xl space-y-8 text-sm leading-6 text-slate-700">
      <header>
        <h2 className="text-2xl font-bold text-slate-900">Hướng dẫn sử dụng</h2>
        <p className="mt-2">
          WebTest Assistant chạy trên tab website bạn đang mở. Kết quả lấy từ DOM và các API trình duyệt, không phải dữ liệu giả.
          Chỉ dùng trên site bạn sở hữu hoặc được phép kiểm thử.
        </p>
      </header>

      <section className="space-y-2">
        <h3 className="text-lg font-semibold text-slate-900">1. Cài đặt vào Chrome</h3>
        <ol className="list-decimal space-y-1 pl-5">
          <li>
            Trong thư mục dự án chạy <code className="rounded bg-slate-100 px-1">npm install</code>,{" "}
            <code className="rounded bg-slate-100 px-1">npm run icons</code>,{" "}
            <code className="rounded bg-slate-100 px-1">npm run build</code>.
          </li>
          <li>
            Mở <code className="rounded bg-slate-100 px-1">chrome://extensions</code>, bật <strong>Developer mode</strong>.
          </li>
          <li>
            Chọn <strong>Load unpacked</strong> và trỏ tới thư mục <code className="rounded bg-slate-100 px-1">dist</code>.
          </li>
          <li>Ghim icon WebTest Assistant lên thanh công cụ để thao tác nhanh.</li>
        </ol>
      </section>

      <section className="space-y-2">
        <h3 className="text-lg font-semibold text-slate-900">2. Chạy kiểm thử từ popup</h3>
        <ol className="list-decimal space-y-1 pl-5">
          <li>Mở tab HTTP hoặc HTTPS của website được phép (không dùng chrome:// hay cửa hàng tiện ích).</li>
          <li>Bấm icon extension. Popup hiển thị tiêu đề và URL tab hiện tại.</li>
          <li>Chọn nhóm: DOM, Liên kết, Biểu mẫu, Khả năng truy cập, Hiệu năng.</li>
          <li>
            Chọn mức: <strong>Cơ bản</strong> (ít liên kết, không axe-core), <strong>Tiêu chuẩn</strong> hoặc{" "}
            <strong>Kỹ</strong>.
          </li>
          <li>Đánh dấu hai ô xác nhận phạm vi và không gửi dữ liệu thật. Tùy chọn cho phép dò liên kết ngoài.</li>
          <li>
            Bấm <strong>Bắt đầu</strong>. Chrome có thể hỏi quyền host <em>ngay lúc bấm nút</em> (không xin khi chỉ mở
            popup). Cho phép nếu muốn dò HTTP; từ chối thì DOM vẫn chạy, liên kết có thể là Không thể xác minh.
          </li>
          <li>Theo dõi thanh tiến trình; dùng <strong>Hủy phiên</strong> nếu cần dừng.</li>
          <li>
            Khi xong, bấm <strong>Dashboard</strong> để xem lịch sử và báo cáo chi tiết.
          </li>
        </ol>
        <p>
          Nút Bắt đầu bị khóa nếu URL không hợp lệ, trang bị Chrome cấm inject, chưa xác nhận phạm vi, hoặc chưa chọn nhóm
          nào.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-lg font-semibold text-slate-900">3. Dashboard</h3>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Tổng quan:</strong> tổng phiên, Passed / Failed / Warning / Skipped / Không thể xác minh, tỷ lệ thành
            công, website đã kiểm, lịch sử và bộ lọc thời gian / URL / trạng thái.
          </li>
          <li>
            <strong>Phiên mới:</strong> nhập URL khớp tab đang mở, chọn nhóm và mức, xác nhận, bắt đầu hoặc hủy.
          </li>
          <li>
            <strong>Báo cáo:</strong> lọc theo trạng thái và mức độ nghiêm trọng; xuất JSON, HTML; In/PDF qua hộp thoại in
            của trình duyệt.
          </li>
          <li>
            <strong>Cấu hình:</strong> ngưỡng hiệu năng (ms), số liên kết tối đa, timeout; xóa toàn bộ lịch sử (có xác nhận).
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h3 className="text-lg font-semibold text-slate-900">4. Cách đọc kết quả</h3>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Passed / Failed:</strong> quy tắc đã có bằng chứng đủ để kết luận.
          </li>
          <li>
            <strong>Warning:</strong> cần kiểm tra thủ công (ví dụ form thiếu action, heading nhảy cấp).
          </li>
          <li>
            <strong>Skipped:</strong> nhóm không chạy hoặc không có đối tượng (ví dụ không có form).
          </li>
          <li>
            <strong>Không thể xác minh:</strong> CORS, thiếu quyền host, timeout, 401/403, API trình duyệt không có dữ liệu.
            Không được hiểu là liên kết hỏng.
          </li>
        </ul>
        <p>
          Tỷ lệ thành công = Passed / (Passed + Failed + Warning) × 100. Skipped và Không thể xác minh{" "}
          <strong>không</strong> tính Passed. Không có mẫu số → hiển thị N/A. axe-core không chứng minh tuân thủ WCAG đầy
          đủ.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-lg font-semibold text-slate-900">5. Demo nhanh cho buổi báo cáo</h3>
        <ol className="list-decimal space-y-1 pl-5">
          <li>
            Terminal: <code className="rounded bg-slate-100 px-1">npm run fixtures</code> rồi mở{" "}
            <code className="rounded bg-slate-100 px-1">http://127.0.0.1:4173/valid.html</code> (cổng mặc định 4173).
          </li>
          <li>Load unpacked thư mục dist, chạy extension trên tab fixture.</li>
          <li>Chạy trên trang thiếu title / thiếu alt / form thiếu label để thấy Failed và Warning.</li>
          <li>Mở báo cáo, xuất HTML, in thử PDF.</li>
          <li>Lọc lịch sử, xóa một phiên (có hộp xác nhận).</li>
        </ol>
      </section>

      <section className="space-y-2">
        <h3 className="text-lg font-semibold text-slate-900">6. Sự cố thường gặp</h3>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Không inject được:</strong> đang ở chrome://, trang Web Store, hoặc PDF. Chuyển sang tab HTTP/HTTPS.
          </li>
          <li>
            <strong>URL không khớp tab:</strong> Dashboard chỉ kiểm tab đang active cùng origin. Mở đúng trang rồi mở lại
            Dashboard, hoặc dùng popup.
          </li>
          <li>
            <strong>Liên kết ngoài không kiểm được:</strong> bật ô cho phép và chấp nhận quyền host khi Chrome hỏi.
          </li>
          <li>
            <strong>Phiên treo / lỗi khi mở lại Chrome:</strong> service worker có thể bị dừng; phiên running quá lâu được
            đánh dấu lỗi khi khởi động lại.
          </li>
          <li>
            Sau khi sửa mã: <code className="rounded bg-slate-100 px-1">npm run build</code> rồi bấm Reload trên{" "}
            <code className="rounded bg-slate-100 px-1">chrome://extensions</code>.
          </li>
        </ul>
      </section>
    </article>
  );
}
