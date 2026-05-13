import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocation, useNavigate } from "react-router-dom";

const PricingSection = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleApplyClick = (serviceType: string) => {
    const params = new URLSearchParams(location.search);
    params.set('service', serviceType);
    navigate({ pathname: location.pathname, search: params.toString(), hash: '#contact' });
    
    // Scroll to contact section smoothly
    setTimeout(() => {
      const contactSection = document.getElementById('contact');
      if (contactSection) {
        contactSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const packages = [
    {
      name: "US Physical Bank",
      price: "$3,000",
      description: "Full-Service high street banking",
      popular: true,
      serviceType: "physical-bank",
      features: [
        "EIN (Tax ID)",
        "Registered Agent Service",
        "Company Formation",
        "Physical Bank Account"
      ]
    },
    {
      name: "US Company Formation",
      price: "$250",
      description: "LLC, C-Corp and Digital Bank",
      popular: false,
      serviceType: "digital-bank",
      features: [
        "EIN (Tax ID)",
        "Registered Agent Service",
        "Company Formation",
        "WISE Business Bank Account"
      ]
    }
  ];

  const includedFeatures = [
    "Company Formation",
    "1st Year Registered Agent",
    "EIN Registration",
    "Physical Address",
    "Bank Account Setup",
    "eSIM with US Phone Number",
    "Real Business Debit Card",
    "Access Payment Services"
  ];

  return (
    <section id="pricing" className="py-8 md:py-10 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">Transparent Pricing</h2>
          <p className="text-muted-foreground text-sm md:text-base mb-4">
            Flat-rate fees with no hidden costs
          </p>

        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto mb-8">
          {packages.map((pkg, index) => (
            <Card key={index} className={`relative ${pkg.popular ? 'border-2 border-primary shadow-lg' : ''}`}>
              {pkg.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-xs">
                  MOST POPULAR
                </Badge>
              )}
              <CardHeader className="text-center pb-4 pt-6">
                <CardTitle className="text-xl mb-3">{pkg.name}</CardTitle>
                <div className="mb-2">
                  <span className="text-3xl md:text-4xl font-bold text-primary">{pkg.price}</span>
                </div>
                <CardDescription className="text-sm">{pkg.description}</CardDescription>
              </CardHeader>
              <CardFooter className="pt-0">
                <Button 
                  className="w-full" 
                  variant={pkg.popular ? "default" : "outline"}
                  onClick={() => handleApplyClick(pkg.serviceType)}
                >
                  Apply Today
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <Card className="border-2 max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle className="text-center">What's Included</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {includedFeatures.map((feature, index) => (
                <div key={index} className="flex items-start gap-2">
                  <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                  </div>
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default PricingSection;
