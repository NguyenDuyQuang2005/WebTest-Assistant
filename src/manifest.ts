import { defineManifest } from "@crxjs/vite-plugin";

export default defineManifest({
  manifest_version: 3,
  name: "WebTest Assistant",
  version: "1.0.0",
  description:
    "Hỗ trợ kiểm thử chất lượng website: DOM, liên kết, biểu mẫu, khả năng truy cập và hiệu năng.",
  icons: {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png",
  },
  action: {
    default_title: "WebTest Assistant",
    default_popup: "src/popup/index.html",
    default_icon: {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png",
    },
  },
  background: {
    service_worker: "src/background/index.ts",
    type: "module",
  },
  options_ui: {
    page: "src/dashboard/index.html",
    open_in_tab: true,
  },
  permissions: ["activeTab", "scripting", "storage", "tabs"],
  optional_host_permissions: ["http://*/*", "https://*/*"],
  host_permissions: [],
});
