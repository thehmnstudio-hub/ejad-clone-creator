import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
const CTA = () => {
  return <section className="py-8 md:py-10 bg-[hsl(var(--hero-bg))] text-white">
      <div className="container mx-auto px-4 text-center max-w-3xl">
        <h2 className="text-2xl md:text-3xl font-bold mb-3">Ready to Join?</h2>
        <p className="text-base md:text-lg mb-6 text-white/90">50 Spots Remaining • Applications processed on rolling basis</p>
        <Link to="/silicon-valley/apply">
          <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground text-base md:text-lg px-8 py-6 w-full sm:w-auto">
            Start Your Application
          </Button>
        </Link>
        
      </div>
    </section>;
};
export default CTA;