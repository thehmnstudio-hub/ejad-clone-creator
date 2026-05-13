import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Building2, DollarSign, Rocket, Users, Lightbulb, GraduationCap } from "lucide-react";

const Experience = () => {
  const experiences = [
    {
      icon: Building2,
      title: "Tech Giant Visits",
      description: "Exclusive tours and meetings at leading tech companies",
      points: [
        "Private tours of Google, Facebook, and Apple campuses",
        "Meet with senior executives and product leaders",
        "Learn about company culture and innovation processes",
        "Understand scaling strategies from billion-dollar companies",
        "Q&A sessions with tech industry veterans"
      ]
    },
    {
      icon: DollarSign,
      title: "Investor Meetings",
      description: "Direct access to VCs and angel investors",
      points: [
        "Pitch practice sessions with real investors",
        "Learn what VCs look for in startups",
        "Networking events with Silicon Valley investors",
        "Understanding term sheets and funding rounds",
        "Connect with Pakistani-American investors"
      ]
    },
    {
      icon: Rocket,
      title: "Startup Ecosystem",
      description: "Experience the vibrant startup culture",
      points: [
        "Visit Y Combinator and 500 Startups offices",
        "Meet with successful YC alumni founders",
        "Learn about accelerator programs and benefits",
        "Understand the Silicon Valley startup playbook",
        "Network with current cohort startups"
      ]
    },
    {
      icon: Users,
      title: "Networking Events",
      description: "Exclusive meetups with Pakistani diaspora",
      points: [
        "Connect with Pakistani tech executives",
        "Meet Pakistani engineers at top companies",
        "Exclusive dinner events with community leaders",
        "Build lasting relationships for future collaboration",
        "Access to private Pakistani professional networks"
      ]
    },
    {
      icon: Lightbulb,
      title: "Innovation Workshops",
      description: "Hands-on sessions on product and growth",
      points: [
        "Design thinking and rapid prototyping workshops",
        "Product-market fit validation techniques",
        "Growth hacking strategies that actually work",
        "User research and customer development",
        "Building products people love"
      ]
    },
    {
      icon: GraduationCap,
      title: "University Visits",
      description: "Explore Stanford and UC Berkeley programs",
      points: [
        "Tour Stanford's d.school and innovation labs",
        "Meet with entrepreneurship program directors",
        "Attend guest lectures and seminars",
        "Learn about research commercialization",
        "Connect with international student communities"
      ]
    }
  ];

  return (
    <section className="py-8 md:py-10 bg-muted/50">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">Your Experience</h2>

        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {experiences.map((exp, index) => {
              const Icon = exp.icon;
              return (
                <AccordionItem key={index} value={`item-${index}`} className="border rounded-lg px-6">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3 text-left">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-semibold text-base">{exp.title}</div>
                        <div className="text-sm text-muted-foreground">{exp.description}</div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <ul className="space-y-2 pt-2 pb-2">
                      {exp.points.map((point, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <span className="text-primary mt-1">•</span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </div>
      </div>
    </section>
  );
};

export default Experience;
