import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, Briefcase, Palmtree } from "lucide-react";

const VisaOptions = () => {
  const options = [
    {
      icon: Palmtree,
      region: "United States",
      visas: [
        { type: "Tourism Visa (B-2)", description: "For tourism and short-term leisure activities" },
        { type: "Business Visa (B-1)", description: "For meetings, conferences, and business negotiations" }
      ]
    },
    {
      icon: Globe,
      region: "European Union",
      visas: [
        { type: "Schengen Visa (Tourism)", description: "Visit multiple countries in the Schengen Area" },
        { type: "EU Business Visa", description: "Travel across EU for business meetings and conferences" }
      ]
    }
  ];

  return (
    <section className="py-12 md:py-16 bg-background">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">Visa Options We Support</h2>
          <p className="text-muted-foreground text-sm md:text-base">
            Comprehensive assistance for both tourism and business travel
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {options.map((option, index) => {
            const Icon = option.icon;
            return (
              <Card key={index} className="border-2">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{option.region}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {option.visas.map((visa, vIndex) => (
                    <div key={vIndex} className="border-l-2 border-primary pl-4">
                      <h4 className="font-semibold mb-1">{visa.type}</h4>
                      <p className="text-sm text-muted-foreground">{visa.description}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default VisaOptions;
