export type ExtensionErrorKind =
  | "user_gesture"
  | "permission_denied"
  | "api"
  | "message"
  | "empty"
  | "site"
  | "unknown";

export function classifyExtensionError(message: string): ExtensionErrorKind {
  const text = message.trim();
  const lower = text.toLowerCase();
  if (!text) {
    return "empty";
  }
  if (lower.includes("user gesture")) {
    return "user_gesture";
  }
  if (
    lower.includes("permission") &&
    (lower.includes("denied") || lower.includes("từ chối") || lower.includes("not granted"))
  ) {
    return "permission_denied";
  }
  if (
    lower.includes("service worker") ||
    lower.includes("receiving end does not exist") ||
    lower.includes("message port") ||
    lower.includes("không gửi được thông điệp") ||
    lower.includes("không phản hồi")
  ) {
    return "message";
  }
  if (
    lower.includes("chrome://") ||
    lower.includes("web store") ||
    lower.includes("không hỗ trợ inject") ||
    lower.includes("restricted")
  ) {
    return "site";
  }
  if (
    lower.includes("cannot access") ||
    lower.includes("tabs cannot be edited") ||
    lower.includes("no tab") ||
    lower.includes("executeScript")
  ) {
    return "api";
  }
  return "unknown";
}

export function userMessageForError(message: string): string {
  const kind = classifyExtensionError(message);
  switch (kind) {
    case "user_gesture":
      return "Chrome chỉ cho phép xin quyền host ngay khi bạn bấm nút. Hãy bấm Bắt đầu (hoặc Thử lại) một lần nữa; đừng để tiện ích tự xin quyền khi mở popup.";
    case "permission_denied":
      return "Bạn đã từ chối quyền host. Phiên vẫn có thể chạy với activeTab; kiểm tra HTTP liên kết có thể ra Không thể xác minh.";
    case "message":
      return "Không liên lạc được với service worker. Hãy Reload tiện ích trên chrome://extensions rồi thử lại.";
    case "site":
      return message;
    case "empty":
      return "Không có dữ liệu phản hồi.";
    default:
      return message;
  }
}
