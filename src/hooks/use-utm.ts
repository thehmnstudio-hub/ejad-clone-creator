import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

export type UTMParams = {
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_term: string;
  utm_content: string;
};

const UTM_KEYS: Array<keyof UTMParams> = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
];

export function useUTM(): UTMParams {
  const [searchParams] = useSearchParams();
  const [utm, setUtm] = useState<UTMParams>({
    utm_source: "",
    utm_medium: "",
    utm_campaign: "",
    utm_term: "",
    utm_content: "",
  });

  useEffect(() => {
    const fromUrl: Partial<UTMParams> = {};
    let hasAnyFromUrl = false;

    UTM_KEYS.forEach((key) => {
      const val = searchParams.get(key) || "";
      if (val) {
        fromUrl[key] = val;
        hasAnyFromUrl = true;
      }
    });

    // Load previously stored UTMs
    let stored: Partial<UTMParams> = {};
    try {
      const raw = localStorage.getItem("utm_params");
      if (raw) stored = JSON.parse(raw);
    } catch {}

    // If URL has UTMs, persist/refresh them
    if (hasAnyFromUrl) {
      const toStore = { ...stored, ...fromUrl } as UTMParams;
      try {
        localStorage.setItem("utm_params", JSON.stringify(toStore));
      } catch {}
      stored = toStore;
    }

    const merged: UTMParams = {
      utm_source: (fromUrl.utm_source || stored.utm_source || "") as string,
      utm_medium: (fromUrl.utm_medium || stored.utm_medium || "") as string,
      utm_campaign: (fromUrl.utm_campaign || stored.utm_campaign || "") as string,
      utm_term: (fromUrl.utm_term || stored.utm_term || "") as string,
      utm_content: (fromUrl.utm_content || stored.utm_content || "") as string,
    };

    setUtm(merged);
  }, [searchParams]);

  return utm;
}
