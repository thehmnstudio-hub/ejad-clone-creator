import { Button } from "@/components/ui/button";
import { Users, Award } from "lucide-react";
const IncHero = () => {
  return <section className="pt-20 md:pt-28 pb-8 md:pb-12 px-4 bg-gradient-to-b from-primary/5 to-background">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-8 md:mb-10">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 leading-tight">
            Get a Physical Bank Account in <span className="text-primary">America</span>
          </h1>
          
          <p className="text-base md:text-lg text-muted-foreground mb-6 md:mb-8 max-w-2xl mx-auto">
            Complete US company formation with LLC, C-Corp registration, and physical bank account setup
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 mb-8 md:mb-10 max-w-xl mx-auto">
          <div className="flex items-center gap-3 p-4 rounded-lg bg-background/50 backdrop-blur-sm border border-border/50 cursor-pointer hover:border-primary/50 transition-colors" onClick={() => document.getElementById('happy-customers')?.scrollIntoView({ behavior: 'smooth' })}>
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <span className="text-sm md:text-base font-semibold">4,000+ Happy Customers</span>
          </div>
          
        </div>
        
        <div className="text-center">
            <Button size="lg" className="text-base md:text-lg px-8 md:px-12 py-6 md:py-7 bg-primary hover:bg-primary/90 w-full sm:w-auto shadow-lg hover:shadow-xl transition-all" onClick={() => document.getElementById('pricing')?.scrollIntoView({
          behavior: 'smooth'
        })}>
            Apply Today
          </Button>
        </div>
      </div>
    </section>;
};
export default IncHero;