import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const ProgramDetails = () => {
  return (
    <section className="py-8 md:py-10 bg-background">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">Program Fee</h2>
        
        <div className="max-w-2xl mx-auto">
          <Card className="border-2 border-primary">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-4xl md:text-5xl mb-3">$8,000</CardTitle>
              <CardDescription className="text-lg md:text-xl">
                Participation Fee
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default ProgramDetails;
