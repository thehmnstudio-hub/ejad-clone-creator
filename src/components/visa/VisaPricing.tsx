import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const VisaPricing = () => {
  const packages = [
    {
      region: "United States",
      price: "$8,000"
    },
    {
      region: "European Union",
      price: "$4,000"
    }
  ];

  const features = [
    "Eligibility assessment",
    "Document preparation",
    "Application submission",
    "Visa interview preparation",
    "Ongoing support through approval"
  ];

  return (
    <section className="py-12 md:py-16 bg-background">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">Transparent Pricing</h2>
          <p className="text-muted-foreground text-sm md:text-base mb-4">
            Flat-rate fees with no hidden costs
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Badge variant="secondary" className="px-3 py-1">
              Flexible Payment Plans Available
            </Badge>
            <Badge variant="secondary" className="px-3 py-1">
              100% Transparent
            </Badge>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {packages.map((pkg, index) => (
            <Card key={index} className="border-2 hover:shadow-lg transition-shadow">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-xl mb-2">{pkg.region}</CardTitle>
                <div className="text-3xl md:text-4xl font-bold text-primary">{pkg.price}</div>
                <p className="text-sm text-muted-foreground mt-2">End-to-end consultation</p>
              </CardHeader>
            </Card>
          ))}
        </div>

        <Card className="border-2">
          <CardHeader>
            <CardTitle className="text-center">What's Included</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 p-6 bg-muted/50 rounded-lg text-center">
          <p className="text-sm md:text-base text-muted-foreground">
            <strong>Note:</strong> Flexible payment options available. Pay in full or in installments. 
            The fee covers the entire process with no surprises.
          </p>
        </div>
      </div>
    </section>
  );
};

export default VisaPricing;
