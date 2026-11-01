/** @vitest-environment jsdom */

import { describe, expect, it } from "vitest";
import { collectPageSnapshot } from "../../src/content/collectPageSnapshot";
import { runDomRules } from "../../src/testing/rules/dom";
import { runFormRules } from "../../src/testing/rules/forms";

describe("thu thập DOM mẫu", () => {
  it("phát hiện thiếu title, alt và label", () => {
    document.documentElement.lang = "vi";
    document.title = "";
    document.body.innerHTML = `
      <img src="/logo.png" />
      <form>
        <input type="text" name="email" />
      </form>
      <a>empty</a>
    `;
    const snapshot = collectPageSnapshot();
    expect(snapshot.title).toBe("");
    expect(snapshot.images[0]?.hasAltAttribute).toBe(false);
    const dom = runDomRules(snapshot, "standard");
    expect(dom.find((item) => item.ruleId === "DOM-001")?.status).toBe("failed");
    expect(dom.find((item) => item.ruleId === "DOM-003")?.status).toBe("failed");
    const forms = runFormRules(snapshot, "standard");
    expect(forms.some((item) => item.ruleId === "FRM-003" || item.ruleId === "FRM-001")).toBe(true);
  });

  it("trang hợp lệ có title và h1", () => {
    document.title = "OK";
    document.body.innerHTML = `<h1>OK</h1><a href="/x">đi</a><button>Lưu</button>`;
    const snapshot = collectPageSnapshot();
    const dom = runDomRules(snapshot, "basic");
    expect(dom.find((item) => item.ruleId === "DOM-001")?.status).toBe("passed");
    expect(dom.find((item) => item.ruleId === "DOM-002")?.status).toBe("passed");
  });
});
