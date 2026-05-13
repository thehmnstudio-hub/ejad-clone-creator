## Goals
Fix logo size inconsistency across all 4 logo-bearing sections on `/inc`, switch to a fixed-container + `object-contain` model, replace pixelated/portrait assets with high-quality SVGs, reorder the form, and add proper CLS/perf attributes.

---

## 1. Form fix — `src/components/inc/ApplicationForm.tsx`
- **Reorder service cards** so the visual + DOM order is:
  1. US Physical Bank
  2. US Company Formation
  3. Ecommerce Platforms
  4. **Others** (always last)
- Change Ecommerce description from `"Account setup or verification (Amazon, Walmart, TikTok Shop, Temu)"` → `"Account setup or verification"`.
- Update `selectedServices` push order in `handleSubmit` to match (Others pushed last) so the Google Sheet row reflects the same order.

---

## 2. Replace `LogoRow.tsx` with a uniform-box system
Drop the `sm/md/lg/tall` size tiers (which were causing the asymmetry). New API:

```tsx
interface Logo { name: string; src: string; srcLight?: string; width: number; height: number; }
interface LogoGridProps {
  logos: Logo[];
  /** Container height in px — every logo gets the SAME box */
  boxH?: number;          // default 48
  boxHMobile?: number;    // default 36
  eager?: boolean;        // top-of-page section
  gapClass?: string;
}
```
Behavior:
- Each logo is wrapped in a fixed-height flex box (`h-9 md:h-12` for boxH=48). Inside: `<img class="max-h-full max-w-full object-contain">` so wide wordmarks and tall stacked marks all sit centered inside the same box, visually balanced.
- `width`/`height` attributes set from native intrinsic dims to prevent CLS.
- `loading={eager ? "eager" : "lazy"}` and `fetchPriority={eager ? "high" : "auto"}`.
- `decoding="async"`.

This single component replaces the old per-logo size tier — symmetry is enforced by container, not per-logo classes.

---

## 3. Replace pixelated/portrait raster logos with SVGs
Source: official press kits + [Simple Icons](https://simpleicons.org) (CC0). Save to `public/logos/` as `.svg` (1–4KB each, infinitely scalable, perfect for retina). Will be told the exact source for each:

| Logo | New file | Source |
|------|----------|--------|
| Wells Fargo | `wells-fargo.svg` | Simple Icons (`wellsfargo`) |
| US Bank | `us-bank.svg` | Simple Icons (`usbank`) |
| Chase | `chase.svg` | Simple Icons (`chase`) |
| Wise | `wise.svg` | Simple Icons (`wise`) |
| Zelle | `zelle.svg` | Simple Icons (`zelle`) |
| PayPal | `paypal.svg` | Simple Icons (`paypal`) |
| Stripe | `stripe.svg` | Simple Icons (`stripe`) |
| Amazon | `amazon.svg` | Simple Icons (`amazon`) |
| Walmart | `walmart.svg` | Simple Icons (`walmart`) |
| **TikTok Shop** | `tiktok-shop.svg` | Custom-built **horizontal wordmark** (TikTok logo + "Shop" text) — the current 429×600 portrait asset is the root cause of the asymmetry |
| Temu | `temu.svg` | Simple Icons (`temu`) |

For media (which need full color photos of newspaper mastheads, not single-color marks), keep WebP but re-crop to remove padding so they all sit naturally inside the same box height. No SVG conversion for these.

---

## 4. Apply uniform sizing per section

| Section | Container height (mobile/desktop) | Eager? | Logos |
|---------|-----------------------------------|--------|-------|
| `GlobalServices` (top, banks) | 36px / 48px | ✅ eager + high priority | Wells Fargo, US Bank, Chase, Wise |
| `FeaturedMedia` (Media Highlights) | 36px / 48px | lazy | Express News, VOA, Arab News, Express Tribune |
| `HowItWorks` → Payment Services | 32px / 40px | lazy | Zelle, PayPal, Stripe |
| `HowItWorks` → Ecommerce Platforms | 32px / 40px | lazy | Amazon, Walmart, TikTok Shop, Temu |

Every logo within a section sits in the **same fixed box** — no per-logo size overrides.

---

## 5. Files to edit
- `src/components/inc/LogoRow.tsx` — rewrite as `LogoGrid` with uniform-box model
- `src/components/inc/GlobalServices.tsx` — switch to SVG sources, mark eager
- `src/components/inc/FeaturedMedia.tsx` — adopt the same uniform-box wrapper
- `src/components/inc/HowItWorks.tsx` — switch payment + ecommerce rows to SVG, uniform box
- `src/components/inc/ApplicationForm.tsx` — reorder cards, trim Ecommerce label
- `public/logos/*.svg` — 11 new SVG files

---

## 6. Final deliverable summary (will produce after edits)
A short report listing:
- ✅ Logos restored: none (audit confirmed nothing was actually removed — PayPal/Stripe/Zelle were intentionally relocated to Payment Services)
- 📐 Unified size per section (table above)
- 📦 File-size deltas: WebP → SVG (~12-31KB each → ~1-4KB each, ~80% reduction)
- 🖼 TikTok Shop: portrait raster → horizontal SVG wordmark (eliminates the main asymmetry)
- ⚡ Above-fold (`GlobalServices`) gets `loading="eager"` + `fetchpriority="high"`; everything else stays `loading="lazy"`
- 📏 Every `<img>` gets explicit `width`/`height` to eliminate CLS