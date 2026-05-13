import { useEffect, useState } from "react";
import { useUTM, type UTMParams } from "@/hooks/use-utm";

export type ClickIds = {
  fbclid: string;
  gclid: string;
  ttclid: string;
  msclkid: string;
  wbraid: string;
  gbraid: string;
  li_fat_id: string;
  twclid: string;
};

export type TrackingPayload = UTMParams &
  ClickIds & {
    fbp: string;
    fbc: string;
    landing_url: string;
    referrer_url: string;
    page_path: string;
    page_url: string;
    user_agent: string;
    language: string;
    timezone: string;
    screen_resolution: string;
    viewport_size: string;
  };

const CLICK_KEYS: Array<keyof ClickIds> = [
  "fbclid",
  "gclid",
  "ttclid",
  "msclkid",
  "wbraid",
  "gbraid",
  "li_fat_id",
  "twclid",
];

function readCookie(name: string): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return match ? decodeURIComponent(match[1]) : "";
}

function persistOnce<T extends Record<string, string>>(storageKey: string, fromUrl: Partial<T>): T {
  let stored: Partial<T> = {};
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) stored = JSON.parse(raw);
  } catch {}
  const hasNew = Object.values(fromUrl).some((v) => !!v);
  if (hasNew) {
    const merged = { ...stored, ...fromUrl } as T;
    try {
      localStorage.setItem(storageKey, JSON.stringify(merged));
    } catch {}
    return merged;
  }
  return stored as T;
}

export function useTracking(): TrackingPayload {
  const utm = useUTM();
  const [data, setData] = useState<TrackingPayload>(() => ({
    ...utm,
    fbclid: "",
    gclid: "",
    ttclid: "",
    msclkid: "",
    wbraid: "",
    gbraid: "",
    li_fat_id: "",
    twclid: "",
    fbp: "",
    fbc: "",
    landing_url: "",
    referrer_url: "",
    page_path: "",
    page_url: "",
    user_agent: "",
    language: "",
    timezone: "",
    screen_resolution: "",
    viewport_size: "",
  }));

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Pull click IDs from current URL
    const params = new URLSearchParams(window.location.search);
    const fromUrl: Partial<ClickIds> = {};
    CLICK_KEYS.forEach((k) => {
      const v = params.get(k) || "";
      if (v) fromUrl[k] = v;
    });
    const clicks = persistOnce<ClickIds>("click_ids", fromUrl);

    // Capture landing URL once per session
    let landing = "";
    try {
      landing = sessionStorage.getItem("landing_url") || "";
      if (!landing) {
        landing = window.location.href;
        sessionStorage.setItem("landing_url", landing);
        sessionStorage.setItem("referrer_url", document.referrer || "");
      }
    } catch {
      landing = window.location.href;
    }
    const referrer = (() => {
      try {
        return sessionStorage.getItem("referrer_url") || document.referrer || "";
      } catch {
        return document.referrer || "";
      }
    })();

    setData({
      ...utm,
      fbclid: clicks.fbclid || "",
      gclid: clicks.gclid || "",
      ttclid: clicks.ttclid || "",
      msclkid: clicks.msclkid || "",
      wbraid: clicks.wbraid || "",
      gbraid: clicks.gbraid || "",
      li_fat_id: clicks.li_fat_id || "",
      twclid: clicks.twclid || "",
      fbp: readCookie("_fbp"),
      fbc: readCookie("_fbc"),
      landing_url: landing,
      referrer_url: referrer,
      page_path: window.location.pathname + window.location.search,
      page_url: window.location.href,
      user_agent: navigator.userAgent || "",
      language: navigator.language || "",
      timezone: (() => {
        try {
          return Intl.DateTimeFormat().resolvedOptions().timeZone || "";
        } catch {
          return "";
        }
      })(),
      screen_resolution:
        typeof window.screen !== "undefined"
          ? `${window.screen.width}x${window.screen.height}`
          : "",
      viewport_size: `${window.innerWidth}x${window.innerHeight}`,
    });
  }, [utm.utm_source, utm.utm_medium, utm.utm_campaign, utm.utm_term, utm.utm_content]);

  return data;
}