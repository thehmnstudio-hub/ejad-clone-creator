import { CheckCircle2, Calendar, MapPin, Rocket, Plane } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

const ProgramTimeline = () => {
  const timeline = [
    {
      number: "1",
      title: "Apply & Get Selected",
      date: "Rolling basis",
      description: "Submit your application. Reviews and interviews happen on a rolling basis through the year.",
      status: "APPLICATIONS OPEN",
      icon: Rocket
    },
    {
      number: "2",
      title: "Pre-Departure Bootcamp",
      date: "September 2026",
      description: "Personalized coaching and visa support to maximize your US tech immersion.",
      icon: CheckCircle2
    },
    {
      number: "3",
      title: "SF Tech Week + Pakistan Tech Summit",
      date: "5–11 October 2026",
      location: "San Francisco, CA",
      description: "Workshops, mentorship, campus tours (Stanford, WeWork) and the 15th Pakistan Tech Summit anchor event.",
      icon: MapPin
    },
    {
      number: "4",
      title: "LA Tech Week",
      date: "12–18 October 2026",
      location: "Los Angeles, CA",
      description: "Studio tours, creator-economy hubs, networking with founders and entertainment leaders.",
      icon: Plane
    },
    {
      number: "5",
      title: "Beyond the Program",
      date: "Oct 2026 onwards",
      description: "Ongoing alumni support and lifelong access to the Ejad Labs community.",
      icon: Rocket
    }
  ];

  return (
    <section className="py-6 md:py-8 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-6 md:mb-8">Program Timeline</h2>

        <div className="max-w-5xl mx-auto">
          <Carousel
            opts={{
              align: "start",
              dragFree: true,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {timeline.map((item, index) => {
                const Icon = item.icon;
                return (
                  <CarouselItem key={index} className="pl-2 md:pl-4 basis-[85%] md:basis-1/2 lg:basis-1/3">
                    <Card className="h-full border-2 relative">
                      <CardContent className="p-4 md:p-6">
                        <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground mx-auto mb-4 flex items-center justify-center font-bold shadow-lg">
                          <Icon className="w-6 h-6" />
                        </div>
                        
                        <div className="text-center mb-3">
                          <div className="flex items-center justify-center gap-2 mb-2">
                            <span className="text-xs font-bold text-primary">STEP {item.number}</span>
                            {item.status && (
                              <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                                {item.status}
                              </span>
                            )}
                          </div>
                          <h3 className="text-base md:text-lg font-bold mb-2">{item.title}</h3>
                        </div>
                        
                        {item.date && (
                          <div className="flex items-center justify-center gap-2 text-xs md:text-sm font-semibold text-primary mb-3">
                            <Calendar className="w-3 h-3 md:w-4 md:h-4" />
                            <span>{item.date}</span>
                          </div>
                        )}
                        
                        {item.location && (
                          <div className="flex items-center justify-center gap-2 text-xs md:text-sm text-muted-foreground mb-3">
                            <MapPin className="w-3 h-3 md:w-4 md:h-4" />
                            <span>{item.location}</span>
                          </div>
                        )}
                        
                        <p className="text-xs md:text-sm text-muted-foreground text-center">
                          {item.description}
                        </p>
                      </CardContent>
                    </Card>
                  </CarouselItem>
                );
              })}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>
      </div>
    </section>
  );
};

export default ProgramTimeline;
