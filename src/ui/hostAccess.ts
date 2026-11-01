import { originPattern, validateHttpUrl } from "../shared/url";

export function hostOriginsForScan(pageUrl: string, checkExternal: boolean): string[] {
  const parsed = validateHttpUrl(pageUrl);
  if (!parsed.ok || !parsed.origin) {
    return [];
  }
  const origins = [originPattern(parsed.origin)];
  if (checkExternal) {
    origins.push("http://*/*", "https://*/*");
  }
  return [...new Set(origins)];
}

export interface HostAccessResult {
  granted: boolean;
  denied: boolean;
  origins: string[];
  error?: string;
}

/**
 * Phải gọi trực tiếp từ handler click (user gesture).
 * Không gọi từ service worker, useEffect, hay setTimeout.
 */
export async function requestHostAccess(pageUrl: string, checkExternal: boolean): Promise<HostAccessResult> {
  const origins = hostOriginsForScan(pageUrl, checkExternal);
  if (origins.length === 0) {
    return { granted: false, denied: false, origins, error: "URL không hợp lệ, không xin được quyền host." };
  }
  try {
    const granted = await chrome.permissions.request({ origins });
    return { granted, denied: !granted, origins };
  } catch (error) {
    const text = error instanceof Error ? error.message : "Không xin được quyền host.";
    return { granted: false, denied: false, origins, error: text };
  }
}
