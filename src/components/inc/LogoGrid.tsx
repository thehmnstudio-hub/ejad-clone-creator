/**
 * Uniform-box logo row.
 *
 * Every logo sits inside the SAME fixed-height container with object-contain,
 * so wordmarks and stacked marks read at the same visual weight regardless of
 * native aspect ratio. Symmetry is enforced by the container — never by per-
 * logo size overrides.
 */

interface Logo {
  name: string;
  src: string;
  /** Native intrinsic dims — used for width/height attrs to prevent CLS */
  w: number;
  h: number;
  /** Optional per-logo height multiplier (e.g. 1.25 makes this logo 25% taller) */
  scale?: number;
}

interface LogoGridProps {
  logos: Logo[];
  /** Container height in tailwind classes, e.g. "h-9 md:h-12" */
  boxClass?: string;
  /** Above-fold logos: eager + high fetch priority */
  eager?: boolean;
  /** Horizontal/vertical gap between logos */
  gapClass?: string;
  /** Optional per-item wrapper class (e.g. "basis-[42%]" to force N-per-row) */
  itemClass?: string;
}

const LogoGrid = ({
  logos,
  boxClass = "h-9 md:h-12",
  eager = false,
  gapClass = "gap-x-8 gap-y-4 md:gap-x-12",
  itemClass = "",
}: LogoGridProps) => {
  return (
    <div className={`flex flex-wrap items-center justify-center ${gapClass}`}>
      {logos.map((logo) => {
        // Compute the rendered display width that matches the box height,
        // so the inline width/height attrs reflect what's actually painted
        // (prevents layout shift before the image decodes).
        const aspect = logo.w / logo.h;
        const scale = logo.scale ?? 1;
        return (
          <div
            key={logo.name}
            className={`${boxClass} ${itemClass} flex items-center justify-center`}
            style={scale !== 1 ? { transform: `scale(${scale})` } : undefined}
          >
            <img
              src={logo.src}
              alt={logo.name}
              width={Math.round(48 * aspect)}
              height={48}
              loading={eager ? "eager" : "lazy"}
              decoding="async"
              fetchPriority={eager ? "high" : "auto"}
              className="max-h-full max-w-full w-auto h-auto object-contain"
            />
          </div>
        );
      })}
    </div>
  );
};

export default LogoGrid;
