import { Link } from "react-router-dom";
import OptimizedImage from "@/components/OptimizedImage";

const BrandPartners = () => {
  const brands = [
    { name: "Yango", logo: "/brands/yango.png" },
    { name: "Spotify", logo: "/brands/spotify.png" },
    { name: "JS Bank", logo: "/brands/jsbank.png" },
    { name: "Jazz", logo: "/brands/jazz.webp" },
    { name: "Classera", logo: "/brands/classera.webp" },
    { name: "Bank of Punjab", logo: "/brands/bop.png" },
    { name: "Epic Games", logo: "/brands/epic-games.webp" },
    { name: "Zindigi", logo: "/brands/zindigi.png" },
    { name: "Graana.com", logo: "/brands/graana.webp" },
    { name: "Binance", logo: "/brands/binance.png" },
    { name: "BSV Blockchain", logo: "/brands/bsv.webp" },
    { name: "Invest Saudi", logo: "/brands/invest-saudi.png" },
    { name: "S&P Global", logo: "/brands/sp-global.webp" },
    { name: "Shorooq Partners", logo: "/brands/shorooq.webp" },
  ];

  return (
    <section className="section-padding-sm bg-background">
      <div className="container mx-auto px-5 sm:px-6">
        <div className="text-center mb-8">
          <h2 className="mb-0 max-w-2xl mx-auto text-foreground/90">
            We worked with the world's biggest brands and the most innovative companies.
          </h2>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4 max-w-4xl mx-auto">
          {brands.map((brand, index) => (
            <div
              key={index}
              className="flex items-center justify-center p-4 md:p-5 rounded-md bg-secondary/60"
            >
              <OptimizedImage
                src={brand.logo}
                alt={`${brand.name} logo`}
                width={120}
                height={48}
                className="h-8 md:h-10 w-full object-contain opacity-70"
              />
            </div>
          ))}
        </div>

        <div className="text-center mt-6">
          <Link
            to="/contact"
            className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors"
          >
            Become a Partner
          </Link>
        </div>
      </div>
    </section>
  );
};

export default BrandPartners;
