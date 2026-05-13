import { CheckCircle2 } from "lucide-react";

const VisaAbout = () => {
  const highlights = [
    "80%+ success rate for first-time applicants",
    "7+ years of experience with U.S. and EU visas",
    "Personalized guidance at every step",
    "Trusted by global entrepreneurs and professionals"
  ];

  return (
    <section className="py-12 md:py-16 bg-background">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Pakistan's Leading U.S. & EU Visa Consultation Platform
          </h2>
          <p className="text-muted-foreground text-base md:text-lg">
            Ejad Labs is trusted by thousands of entrepreneurs, professionals, and families to navigate the visa process successfully
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mt-8">
          {highlights.map((highlight, index) => (
            <div key={index} className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
              <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <p className="text-sm md:text-base">{highlight}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default VisaAbout;
