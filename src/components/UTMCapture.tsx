import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
] as const;

export function UTMCapture() {
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const fromUrl: Partial<Record<(typeof UTM_KEYS)[number], string>> = {};
    let hasAny = false;

    UTM_KEYS.forEach((key) => {
      const v = params.get(key) || "";
      if (v) {
        fromUrl[key] = v;
        hasAny = true;
      }
    });

    if (hasAny) {
      try {
        const raw = localStorage.getItem("utm_params");
        const prev = raw ? JSON.parse(raw) : {};
        localStorage.setItem("utm_params", JSON.stringify({ ...prev, ...fromUrl }));
      } catch {}
    }
  }, [location.search]);

  return null;
}
