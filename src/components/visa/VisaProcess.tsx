import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, FileCheck, Send, MessageSquare, ThumbsUp } from "lucide-react";

const VisaProcess = () => {
  const steps = [
    {
      icon: CheckCircle2,
      title: "Eligibility Check",
      description: "Submit your information to determine if you qualify"
    },
    {
      icon: FileCheck,
      title: "Document Preparation",
      description: "Get personalized assistance to gather required documents"
    },
    {
      icon: Send,
      title: "Application Submission",
      description: "We guide you through every step to ensure accuracy"
    },
    {
      icon: MessageSquare,
      title: "Interview Preparation",
      description: "Expert tips and mock sessions for your visa interview"
    },
    {
      icon: ThumbsUp,
      title: "Approval & Support",
      description: "Continued support from approval to post-approval guidance"
    }
  ];

  return (
    <section className="py-12 md:py-16 bg-muted/50">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">How It Works</h2>
          <p className="text-muted-foreground text-sm md:text-base">
            A simple, step-by-step process to get your visa approved
          </p>
        </div>

        {/* CSS scroll-snap (no JS): same UX, zero JS payload */}
        <div className="flex gap-3 md:gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-none -mx-4 px-4 lg:grid lg:grid-cols-5 lg:overflow-visible lg:mx-0 lg:px-0">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <Card key={index} className="relative border-2 text-center h-full shrink-0 w-[85%] sm:w-1/2 lg:w-auto snap-center">
                <CardContent className="p-4">
                  <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground mx-auto mb-3 flex items-center justify-center font-bold">
                    {index + 1}
                  </div>
                  <Icon className="h-8 w-8 text-primary mx-auto mb-3" />
                  <h4 className="font-semibold text-sm mb-2">{step.title}</h4>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default VisaProcess;
