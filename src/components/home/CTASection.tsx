import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const CTASection = () => {
  return (
    <section className="section-padding relative overflow-hidden bg-primary">
      <div className="container mx-auto px-5 sm:px-6 text-center relative z-10">
        <h2 className="mb-3 text-primary-foreground">
          Ready to Take Your Business Global?
        </h2>
        <p className="text-base sm:text-lg mb-8 max-w-xl mx-auto text-primary-foreground/80">
          Join 700+ Pakistani entrepreneurs who've accessed global markets through our programs
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/silicon-valley/apply">
            <Button size="lg" className="gap-2 bg-primary-foreground text-primary hover:bg-primary-foreground/90 px-7 py-6 text-base shadow-md w-full sm:w-auto font-medium">
              Apply for Silicon Valley Program
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link to="/visa">
            <Button size="lg" variant="outline" className="gap-2 bg-transparent border-2 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 px-7 py-6 text-base w-full sm:w-auto font-medium">
              Check Visa Eligibility
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
