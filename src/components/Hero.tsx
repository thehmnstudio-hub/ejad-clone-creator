import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import OptimizedImage from "@/components/OptimizedImage";

const Hero = () => {
  return (
    <section className="pt-24 md:pt-28 pb-8 md:pb-12 bg-gradient-to-b from-primary/10 via-accent/10 to-background">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <OptimizedImage
              src="/golden-gate.jpg" 
              alt="Golden Gate Bridge" 
              width={1200}
              height={400}
              eager
              responsive
              className="w-full h-[300px] md:h-[400px] object-cover rounded-2xl shadow-xl"
            />
          </div>
          
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex flex-col items-center gap-3 mb-6">
              <Badge variant="secondary" className="bg-primary/10 backdrop-blur-sm border-primary/30 px-4 py-2 text-xs md:text-sm font-medium">
                Applications Open
              </Badge>
               <Badge variant="secondary" className="bg-primary text-primary-foreground px-4 py-2 text-xs md:text-sm font-medium">
                 5 - 18 October 2026
               </Badge>
            </div>

             <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
               Silicon Valley Tech Exchange
             </h1>

            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              2-week immersion across San Francisco & Los Angeles — anchored by the 15th Pakistan Tech Summit, SF Tech Week, and LA Tech Week.
            </p>

            <Button 
              size="lg" 
              className="bg-primary hover:bg-primary/90 text-primary-foreground text-base md:text-lg px-8 md:px-10 py-6 md:py-7 shadow-xl hover:shadow-2xl transition-all w-full sm:w-auto"
              onClick={() => {
                const section = document.querySelector('#application-form');
                if (section) {
                  section.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
            >
              Apply Today
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
