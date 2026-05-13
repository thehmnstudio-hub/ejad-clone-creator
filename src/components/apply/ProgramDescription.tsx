import { Card, CardContent } from "@/components/ui/card";

const ProgramDescription = () => {
  return (
    <section className="py-6 md:py-8 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">
            2-Week Immersion Across San Francisco & Los Angeles
          </h2>
          <p className="text-sm md:text-base text-muted-foreground">
            Anchored by the 15th Pakistan Tech Summit, SF Tech Week, and LA Tech Week. Workshops, business matchmaking, mentorship sessions, campus and studio tours, and networking with founders, investors, and operators across both coasts.
          </p>
        </div>
      </div>
    </section>
  );
};

export default ProgramDescription;
