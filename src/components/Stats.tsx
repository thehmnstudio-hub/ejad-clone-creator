// Plain CSS-grid logo strip — replaced the embla carousel which cost ~3s of
// bootup time on mobile (per Lighthouse). With only 6 unique logos a carousel
// adds zero UX value and forces the entire embla library + its plugins onto
// the critical path of the public landing page.
const partners = [
  { name: "Stanford", logo: "/partners/stanford-logo.webp" },
  { name: "500 Startups", logo: "/partners/500startups-logo.webp" },
  { name: "Uber", logo: "/partners/uber-logo.webp" },
  { name: "Airbnb", logo: "/partners/airbnb-logo.webp" },
  { name: "Draper University", logo: "/partners/draper-university-logo.webp" },
  { name: "StartX", logo: "/partners/startx-logo.webp" },
];

const Stats = () => (
  <section className="py-8 md:py-10 bg-background">
    <div className="container mx-auto px-4">
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 md:gap-8 max-w-3xl mx-auto items-center">
        {partners.map((p) => (
          <div key={p.name} className="flex items-center justify-center">
            <img
              src={p.logo}
              alt={p.name}
              loading="lazy"
              decoding="async"
              width={120}
              height={64}
              className="h-10 md:h-14 w-full object-contain opacity-80 hover:opacity-100 transition-opacity"
            />
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default Stats;
