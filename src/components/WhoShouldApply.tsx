import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const WhoShouldApply = () => {
  const idealCandidates = [
    "Startup founders and co-founders",
    "Technology entrepreneurs",
    "Business executives in tech companies",
    "Investors and venture capitalists",
    "Government officials in technology roles",
    "Graduate students in business/engineering"
  ];

  const requirements = [
    "Valid Pakistani passport",
    "Minimum 2 years relevant experience",
    "Strong English communication skills",
    "Commitment to full program participation",
    "Vision for global expansion",
    "Ability to contribute to group learning"
  ];

  return (
    <section className="py-8 md:py-10 bg-muted/50">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-6">Who Should Apply</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <Card className="border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg md:text-xl">Ideal For</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm md:text-base">
                {idealCandidates.map((candidate, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>{candidate}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg md:text-xl">Requirements</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm md:text-base">
                {requirements.map((requirement, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>{requirement}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default WhoShouldApply;
