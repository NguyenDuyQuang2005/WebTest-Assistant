import { describe, expect, it } from "vitest";
import { classifyExtensionError, userMessageForError } from "../../src/shared/errors";

describe("phân loại lỗi giao diện", () => {
  it("nhận lỗi user gesture", () => {
    expect(classifyExtensionError("This function must be called during a user gesture")).toBe("user_gesture");
    expect(userMessageForError("This function must be called during a user gesture")).toMatch(/bấm Bắt đầu/i);
  });

  it("nhận lỗi message passing", () => {
    expect(classifyExtensionError("Could not establish connection. Receiving end does not exist.")).toBe("message");
    expect(classifyExtensionError("Service worker không phản hồi. Hãy thử lại.")).toBe("message");
  });

  it("nhận trang chrome:// không inject được", () => {
    expect(classifyExtensionError("Tab không hỗ trợ inject script (chrome://, Web Store hoặc trang bị hạn chế).")).toBe(
      "site",
    );
  });

  it("chuỗi rỗng không bị gộp thành user_gesture", () => {
    expect(classifyExtensionError("")).toBe("empty");
  });
});
