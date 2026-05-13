import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";

const ProgramCosts = () => {
  const includes = [
    "Visa Application Fees",
    "Conference and event tickets",
    "Photography and videography",
    "Travel Insurance",
    "Select meals per program agenda"
  ];

  const notIncludes = [
    "Personal meals and expenses",
    "Tips and gratuities",
    "Medical services"
  ];

  return (
    <section id="program-fee" className="py-8 md:py-12 bg-background">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-6 md:mb-8">Program Fee</h2>

        <div className="max-w-3xl mx-auto">
          <Card className="border-2 border-primary">
            <CardHeader className="text-center pb-4 md:pb-6">
              <CardTitle className="text-3xl md:text-5xl mb-2 md:mb-3 text-primary">$8,000</CardTitle>
              <CardDescription className="text-lg md:text-xl font-semibold text-foreground">
                Participation Fee
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 md:space-y-6">
              <div className="grid md:grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-3">
                  <h3 className="font-bold text-base md:text-lg flex items-center gap-2">
                    <Check className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
                    Includes
                  </h3>
                  <ul className="space-y-2">
                    {includes.map((item, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm md:text-base">
                        <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-3">
                  <h3 className="font-bold text-base md:text-lg flex items-center gap-2">
                    <X className="w-4 h-4 md:w-5 md:h-5 text-destructive" />
                    Not Included
                  </h3>
                  <ul className="space-y-2">
                    {notIncludes.map((item, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm md:text-base">
                        <X className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default ProgramCosts;
