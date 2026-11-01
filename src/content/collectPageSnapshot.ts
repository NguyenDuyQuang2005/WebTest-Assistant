import type { PageSnapshot } from "../shared/types";

/**
 * Hàm tự chứa: mọi helper nằm bên trong để chrome.scripting.executeScript
 * và Playwright page.evaluate serialize được.
 */
export function collectPageSnapshot(): PageSnapshot {
  const MAX_LINKS = 200;
  const MAX_IMAGES = 100;
  const MAX_CONTROLS = 120;

  const textOf = (el: Element | null): string => {
    if (!el) {
      return "";
    }
    return (el.textContent ?? "").replace(/\s+/g, " ").trim();
  };

  const attr = (el: Element, name: string): string | null => {
    const value = el.getAttribute(name);
    return value === null ? null : value;
  };

  const cssEscape = (value: string): string => {
    if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
      return CSS.escape(value);
    }
    return value.replace(/"/g, '\\"');
  };

  const labelledBy = (el: Element): string | null => {
    const labelled = el.getAttribute("aria-labelledby");
    if (labelled) {
      const parts = labelled
        .split(/\s+/)
        .map((item) => document.getElementById(item))
        .filter((item): item is HTMLElement => item !== null)
        .map((item) => textOf(item))
        .filter(Boolean);
      if (parts.length > 0) {
        return parts.join(" ");
      }
    }
    const aria = el.getAttribute("aria-label");
    if (aria && aria.trim()) {
      return aria.trim();
    }
    if (el.id) {
      const lab = document.querySelector(`label[for="${cssEscape(el.id)}"]`);
      if (lab) {
        return textOf(lab);
      }
    }
    const parentLabel = el.closest("label");
    if (parentLabel) {
      return textOf(parentLabel);
    }
    return null;
  };

  const validationAttrs = (el: HTMLElement): string[] => {
    const names = ["required", "minlength", "maxlength", "min", "max", "pattern", "step"];
    return names.filter((name) => el.hasAttribute(name));
  };

  const url = location.href;
  const origin = location.origin;
  const title = document.title ?? "";
  const lang = document.documentElement.lang || null;

  const headings = Array.from(document.querySelectorAll("h1,h2,h3,h4,h5,h6")).map((node) => ({
    level: Number(node.tagName.slice(1)),
    text: textOf(node).slice(0, 180),
  }));

  const imageNodes = Array.from(document.querySelectorAll("img"));
  const truncatedImages = imageNodes.length > MAX_IMAGES;
  const images = imageNodes.slice(0, MAX_IMAGES).map((img) => {
    const altAttr = img.getAttribute("alt");
    const role = img.getAttribute("role");
    return {
      src: img.currentSrc || img.src || attr(img, "src") || "",
      alt: altAttr,
      hasAltAttribute: img.hasAttribute("alt"),
      role,
      decorative: role === "presentation" || role === "none" || altAttr === "",
    };
  });

  const linkNodes = Array.from(document.querySelectorAll("a"));
  const truncatedLinks = linkNodes.length > MAX_LINKS;
  const links = linkNodes.slice(0, MAX_LINKS).map((anchor) => {
    const text = textOf(anchor);
    const aria = anchor.getAttribute("aria-label");
    return {
      href: anchor.getAttribute("href") ?? "",
      text,
      name: (aria || text || anchor.getAttribute("title") || "").trim(),
      target: anchor.getAttribute("target"),
      rel: anchor.getAttribute("rel"),
    };
  });

  const forms = Array.from(document.querySelectorAll("form")).map((form) => ({
    id: form.id || null,
    name: form.getAttribute("name"),
    method: form.getAttribute("method"),
    action: form.getAttribute("action"),
    hasPasswordField: Boolean(form.querySelector('input[type="password"]')),
    controlCount: form.querySelectorAll("input,textarea,select,button").length,
  }));

  const controlNodes = Array.from(document.querySelectorAll("input, textarea, select, button")) as HTMLElement[];
  const truncatedControls = controlNodes.length > MAX_CONTROLS;
  const controls = controlNodes.slice(0, MAX_CONTROLS).map((el) => {
    const input = el as HTMLInputElement;
    const tag = el.tagName.toLowerCase();
    const type = tag === "input" ? input.type || "text" : attr(el, "type");
    const label = labelledBy(el);
    return {
      tag,
      type,
      name: attr(el, "name"),
      id: el.id || null,
      required: el.hasAttribute("required"),
      disabled: el.hasAttribute("disabled"),
      readOnly: el.hasAttribute("readonly"),
      label,
      placeholder: attr(el, "placeholder"),
      autocomplete: attr(el, "autocomplete"),
      validationAttrs: validationAttrs(el),
      accessibleName: (label || attr(el, "aria-label") || input.value || textOf(el) || "").trim(),
    };
  });

  const buttons = Array.from(
    document.querySelectorAll("button, input[type='button'], input[type='submit'], [role='button']"),
  ).map((el) => {
    const input = el as HTMLInputElement;
    const accessibleName = (
      labelledBy(el) ||
      attr(el, "aria-label") ||
      attr(el, "title") ||
      input.value ||
      textOf(el)
    ).trim();
    return {
      text: textOf(el).slice(0, 120),
      type: attr(el, "type"),
      accessibleName,
      disabled: el.hasAttribute("disabled"),
    };
  });

  const ids = Array.from(document.querySelectorAll("[id]"))
    .map((node) => node.id)
    .filter(Boolean);
  const seen = new Map<string, number>();
  for (const id of ids) {
    seen.set(id, (seen.get(id) ?? 0) + 1);
  }
  const duplicateIds = [...seen.entries()].filter(([, count]) => count > 1).map(([id]) => id);

  const ariaIssues: string[] = [];
  const known =
    /^(aria-label|aria-labelledby|aria-describedby|aria-hidden|aria-invalid|aria-expanded|aria-controls|aria-live|aria-busy|aria-current|aria-disabled|aria-pressed|aria-checked|aria-selected|aria-required|aria-haspopup|aria-modal|aria-valuemin|aria-valuemax|aria-valuenow|aria-orientation|aria-atomic|aria-relevant|aria-roledescription|aria-placeholder|aria-colindex|aria-rowindex|aria-sort)$/;
  for (const el of Array.from(document.querySelectorAll("*"))) {
    for (const attribute of Array.from(el.attributes)) {
      if (attribute.name.startsWith("aria-") && !known.test(attribute.name)) {
        ariaIssues.push(`${attribute.name} trên <${el.tagName.toLowerCase()}>`);
      }
    }
  }

  const emptyHref = links.filter((item) => !item.href.trim()).length;
  const suspicious = emptyHref > 0 ? [`${emptyHref} liên kết không có href`] : [];

  const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
  const ttfbMs = nav ? Math.round(nav.responseStart) : null;
  const domContentLoadedMs = nav ? Math.round(nav.domContentLoadedEventEnd) : null;
  const loadEventMs = nav ? Math.round(nav.loadEventEnd) : null;
  const transferSize = nav && "transferSize" in nav ? nav.transferSize : null;
  const lcpEntry = performance.getEntriesByType("largest-contentful-paint").at(-1) as PerformanceEntry | undefined;
  const lcpMs = lcpEntry ? Math.round(lcpEntry.startTime) : null;

  return {
    collectedAt: new Date().toISOString(),
    url,
    origin,
    title,
    lang,
    headings,
    images,
    links,
    forms,
    controls,
    buttons,
    ids,
    duplicateIds,
    ariaIssues: ariaIssues.slice(0, 30),
    suspicious,
    performance: {
      ttfbMs,
      domContentLoadedMs,
      loadEventMs,
      transferSize,
      lcpMs,
    },
    limits: {
      truncatedLinks,
      truncatedImages,
      truncatedControls,
    },
  };
}
