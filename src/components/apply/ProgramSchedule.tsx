import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Calendar, ExternalLink } from "lucide-react";

const ProgramSchedule = () => {
  const events = [
    {
      title: "15th Pakistan Tech Summit",
      date: "Sunday, October 11, 2026",
      location: "San Francisco",
      image: "/pakistan-tech-summit-800w.webp",
      highlights: [
        "Anchor event of the program — part of SF Tech Week",
        "Founders, investors, and tech leaders across AI, fintech, gaming, cloud",
        "Organized by Ejad Labs — 15th global edition"
      ],
      link: "https://partiful.com/e/kVhaLktWJTM19P3nUSI8"
    },
    {
      title: "SF Tech Week",
      date: "October 5–11, 2026",
      location: "San Francisco (SOMA)",
      image: "/golden-gate-800w.webp",
      highlights: [
        "Presented by a16z — tech's largest decentralized conference",
        "1,000+ events: demo days, founder dinners, VC salons, hackathons",
        "Themes: AI, biotech, fintech, infrastructure, global talent"
      ],
      link: "https://www.tech-week.com/"
    },
    {
      title: "LA Tech Week",
      date: "October 12–18, 2026",
      location: "Los Angeles",
      image: "/la-tech-week.webp",
      highlights: [
        "Presented by a16z — 100+ events across LA",
        "Tech × media × entertainment × creator economy",
        "Anchored by Tech St. Santa Monica city-wide activation"
      ],
      link: "https://www.tech-week.com/"
    }
  ];

  return (
    <section className="py-8 md:py-12 bg-muted/30">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-6 md:mb-8">Key Events</h2>

        <div className="max-w-5xl mx-auto grid gap-6 md:gap-8">
          {events.map((event, index) => (
            <Card key={index} className="overflow-hidden hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/30">
              <div className="grid md:grid-cols-3 gap-0">
                {/* Image section */}
                <div className="md:col-span-1 relative h-48 md:h-auto">
                  <img 
                    src={event.image} 
                    alt={event.title}
                    loading="lazy"
                    decoding="async"
                    width={800}
                    height={600}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-background/20 to-transparent"></div>
                </div>
                
                {/* Content section */}
                <div className="md:col-span-2 p-6">
                  <CardHeader className="p-0 pb-4">
                    <CardTitle className="text-xl md:text-2xl">{event.title}</CardTitle>
                    <CardDescription className="text-sm md:text-base flex items-center gap-2 mt-2">
                      <Calendar className="w-4 h-4" />
                      {event.date} • {event.location}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ul className="space-y-2 md:space-y-3 mb-4">
                      {event.highlights.map((highlight, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-sm md:text-base">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0"></span>
                          <span>{highlight}</span>
                        </li>
                      ))}
                    </ul>
                    {event.link && (
                      <a 
                        href={event.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
                      >
                        Learn more <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </CardContent>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProgramSchedule;
