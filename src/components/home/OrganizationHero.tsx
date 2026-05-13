import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";

const OrganizationHero = () => {
  const scrollToPrograms = () => {
    const element = document.getElementById('services-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section className="relative min-h-[80vh] md:min-h-[85vh] flex items-center justify-center overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background">
      <div className="container mx-auto px-5 sm:px-6 relative z-10 text-center max-w-3xl py-20 md:py-28">
        <p className="text-primary font-medium text-sm tracking-wide uppercase mb-4">
          Established 2014 · Pakistan
        </p>

        <h1 className="mb-5 md:mb-6">
          Pakistan's Leading Platform for{" "}
          <span className="text-primary">Global Business Access</span>
        </h1>

        <p className="text-muted-foreground mx-auto mb-8 md:mb-10 text-base sm:text-lg">
          Empowering Pakistani entrepreneurs with Silicon Valley connections, US company formation, and visa solutions
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-12 px-4">
          <Link to="/silicon-valley" className="w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto text-base px-7 py-6 shadow-md hover:shadow-lg transition-all group">
              Apply to Silicon Valley Program
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          <Button
            size="lg"
            variant="outline"
            onClick={scrollToPrograms}
            className="w-full sm:w-auto text-base px-7 py-6 border-border hover:border-primary/40"
          >
            Explore All Programs
          </Button>
        </div>

        <div className="flex flex-wrap justify-center gap-x-6 gap-y-3 text-sm text-muted-foreground">
          {["500+ Entrepreneurs", "15+ Countries", "10+ Years Experience"].map((stat) => (
            <div key={stat} className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
              <span>{stat}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default OrganizationHero;
