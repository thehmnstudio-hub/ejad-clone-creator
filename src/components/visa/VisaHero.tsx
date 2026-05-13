import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const VisaHero = () => {
  const scrollToForm = () => {
    document.getElementById('visa-application')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden pt-20 bg-gradient-to-b from-primary/10 via-background to-background">
      <div className="container mx-auto px-4 relative z-10 text-center max-w-4xl">
        <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/30 px-4 py-2 text-xs md:text-sm font-medium mb-6">
          80%+ Success Rate
        </Badge>

        <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
          Pakistan's Leading U.S. & EU Visa Consultation Platform
        </h1>

        <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
          Navigate the complexities of U.S. and EU visa processes with Ejad Labs' trusted guidance
        </p>

        <Button 
          size="lg" 
          onClick={scrollToForm}
          className="text-base md:text-lg px-8 md:px-10 py-6 md:py-7 shadow-xl hover:shadow-2xl transition-all hover:scale-105 w-full sm:w-auto"
        >
          See If You Qualify
        </Button>

        <div className="flex flex-wrap justify-center gap-6 mt-8">
          <div className="flex items-center gap-2">
            <span className="text-2xl">✓</span>
            <span className="font-semibold">500+ Visa Approvals</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default VisaHero;
