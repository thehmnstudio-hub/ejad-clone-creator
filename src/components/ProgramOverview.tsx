import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Users, MapPin, Award } from "lucide-react";

const ProgramOverview = () => {
  const features = [
    { icon: Calendar, title: "2 Weeks", description: "Intensive program duration" },
    { icon: Users, title: "50 Spots Left", description: "Limited exclusive cohort" },
    { icon: MapPin, title: "SF + LA", description: "Both coasts of US tech" },
    { icon: Award, title: "Certificate", description: "Official program completion" },
  ];

  return (
    <section className="py-8 md:py-10 bg-background">
      <div className="container mx-auto px-4">

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-4xl mx-auto">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div key={index} className="text-center">
                <div className="w-12 h-12 md:w-14 md:h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Icon className="w-6 h-6 md:w-7 md:h-7 text-primary" />
                </div>
                <h3 className="text-base md:text-lg font-bold mb-1">{feature.title}</h3>
                <p className="text-xs md:text-sm text-muted-foreground">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ProgramOverview;
