import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";

const ApplicationHeader = () => {
  return (
    <section className="py-8 md:py-12 bg-gradient-to-b from-primary/5 to-background">
      <div className="container mx-auto px-4 text-center">
        <h1 className="text-3xl md:text-4xl font-bold mb-3 md:mb-4">Apply to Pak-US Tech Exchange Program</h1>
        <Badge variant="secondary" className="bg-primary text-primary-foreground px-4 md:px-6 py-2 md:py-3 text-sm md:text-base">
          <Calendar className="w-3 h-3 md:w-4 md:h-4 mr-2" />
          4 - 19 October 2026
        </Badge>
      </div>
    </section>
  );
};

export default ApplicationHeader;
