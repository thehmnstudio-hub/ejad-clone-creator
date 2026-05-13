import LogoGrid from "./LogoGrid";

// Native intrinsic dims (from public/logos/*.webp) — used for CLS-safe
// width/height attrs in LogoGrid.
const banks = [
  { name: "Wells Fargo", src: "/logos/wells-fargo.webp", w: 600, h: 301 },
  { name: "US Bank",     src: "/logos/us-bank.webp",     w: 600, h: 150 },
  { name: "Chase",       src: "/logos/chase.webp",       w: 600, h: 111 },
  { name: "Wise",        src: "/logos/wise.webp",        w: 600, h: 136 },
  { name: "Zelle",       src: "/logos/zelle.webp",       w: 600, h: 260 },
];

const GlobalServices = () => {
  return (
    <section className="py-6 md:py-8 bg-background">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* eager: this section sits high on the page and is often the first
            non-hero block visible on mobile */}
        {/* 2x2 grid: basis ~42% forces exactly 2 logos per row, taller box
            so the logos read at a more confident size */}
        <LogoGrid
          logos={banks}
          boxClass="h-12 md:h-16"
          itemClass="basis-[42%] md:basis-[40%] max-w-[260px]"
          gapClass="gap-x-10 gap-y-6 md:gap-x-16 md:gap-y-8"
          eager
        />
      </div>
    </section>
  );
};

export default GlobalServices;
