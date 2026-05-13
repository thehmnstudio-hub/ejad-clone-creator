import { Card, CardContent } from "@/components/ui/card";
import { Building2, CreditCard } from "lucide-react";
import LogoGrid from "./LogoGrid";

const formationSteps = [
  { icon: Building2,  title: "Company Formation & EIN", description: "US LLC or C-Corp setup with IRS Tax ID" },
  { icon: CreditCard, title: "Physical Bank Account",   description: "US business bank account" },
];

// Native intrinsic dims drive CLS-safe width/height attrs
const ecommerceLogos = [
  { name: "Amazon",      src: "/logos/amazon.webp",      w: 600, h: 180 },
  // Walmart's wordmark reads small at the row height — bump 30% to balance
  { name: "Walmart",     src: "/logos/walmart.webp",     w: 600, h: 197, scale: 1.3 },
  { name: "TikTok Shop", src: "/logos/tiktok-shop.webp", w: 600, h: 121 },
  { name: "Temu",        src: "/logos/temu.webp",        w: 437, h: 130 },
];

const LogoStrip = ({ title, logos }: { title: string; logos: { name: string; src: string; w: number; h: number }[] }) => (
  <Card className="border">
    <CardContent className="p-3 md:p-4">
      <h4 className="text-center font-semibold text-xs md:text-sm mb-3 text-muted-foreground uppercase tracking-wide">
        {title}
      </h4>
      <LogoGrid logos={logos} boxClass="h-8 md:h-10" gapClass="gap-x-6 gap-y-2 md:gap-x-10" />
    </CardContent>
  </Card>
);

const HowItWorks = () => {
  return (
    <section className="py-6 md:py-8 bg-muted/50">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="text-center mb-4 md:mb-6">
          <h2 className="text-xl md:text-2xl font-bold mb-0">How It Works</h2>
          <p className="text-muted-foreground text-xs md:text-sm">
            Establish and grow your US business presence
          </p>
        </div>

        <div className="space-y-2 md:space-y-3">
          {/* Row 1 — formation steps */}
          <div className="grid grid-cols-2 gap-2 md:gap-3">
            {formationSteps.map((step) => (
              <Card key={step.title} className="border text-center">
                <CardContent className="p-3 md:p-4">
                  <step.icon className="h-5 w-5 md:h-6 md:w-6 text-primary mx-auto mb-2" />
                  <h4 className="font-semibold text-xs md:text-sm mb-0.5 leading-tight">
                    {step.title}
                  </h4>
                  <p className="text-[11px] md:text-xs text-muted-foreground leading-snug">
                    {step.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Row 2 — ecommerce platforms (uniform 32/40px box) */}
          <LogoStrip title="Ecommerce Platforms" logos={ecommerceLogos} />
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
