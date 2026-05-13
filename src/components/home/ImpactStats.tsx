import { Card, CardContent } from "@/components/ui/card";
import { Users, Award, Globe, Building } from "lucide-react";

const ImpactStats = () => {
  const stats = [
    { icon: Building, number: "$300M+", label: "Investment Brought", description: "To Pakistan's economy" },
    { icon: Users, number: "100K+", label: "Jobs Created", description: "Through our initiatives" },
    { icon: Globe, number: "700+", label: "International Guests", description: "Hosted in Pakistan" },
    { icon: Award, number: "500+", label: "Visa Approvals", description: "To EU/USA destinations" }
  ];

  return (
    <section className="section-padding-sm bg-primary/[0.03]">
      <div className="container mx-auto px-5 sm:px-6">
        <div className="text-center mb-8 md:mb-10">
          <h2 className="mb-2">Our Impact</h2>
          <p className="text-muted-foreground text-sm sm:text-base mx-auto">
            Trusted by Pakistan's leading entrepreneurs and innovators
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="text-center border border-border/50 bg-card">
                <CardContent className="pt-5 pb-4 px-3">
                  <div className="inline-flex p-2.5 rounded-full bg-primary/8 mb-3">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-xl sm:text-2xl lg:text-3xl font-heading font-bold text-primary mb-0.5">
                    {stat.number}
                  </div>
                  <div className="font-medium text-xs sm:text-sm mb-0.5">{stat.label}</div>
                  <div className="text-[11px] sm:text-xs text-muted-foreground">{stat.description}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ImpactStats;
