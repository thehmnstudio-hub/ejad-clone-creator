import UnifiedHeader from "@/components/UnifiedHeader";
import UnifiedFooter from "@/components/UnifiedFooter";

const Legacy = () => {
  const legacyEvents = [
    { year: "2018", event: "PAK US Tech Exchange", image: "/legacy/2018-pak-us.jpg" },
    { year: "2019", event: "PAK US Tech Exchange", image: "/legacy/2019-pak-us.webp" },
    { year: "2019", event: "Pakistan Tech Summit, Oslo, Norway", image: "/legacy/2019-oslo.avif" },
    { year: "2020", event: "Pakistan Tech Summit, Silicon Valley, USA", image: "/legacy/2020-silicon-valley.jpeg" },
    { year: "2021", event: "Pakistan Tech Summit, Istanbul, Turkey", image: "/legacy/2021-istanbul.jpg" },
    { year: "2022", event: "PAK US Tech Exchange", image: "/legacy/2022-pak-us.webp" },
    { year: "2022", event: "Participation at IFA Berlin, Germany", image: "/legacy/2022-ifa-berlin.png" },
    { year: "2022", event: "Pakistan Tech Summit, Oslo, Norway", image: "/legacy/2022-oslo.png" },
    { year: "2022", event: "Future Fest", image: "/legacy/2022-future-fest.jpg" },
    { year: "2023", event: "Pakistan Tech Summit, UAE", image: "/legacy/2023-uae.png" },
    { year: "2023", event: "Pakistan Tech Summit, Oslo, Norway", image: "/legacy/2022-oslo.png" },
    { year: "2023", event: "Future Fest", image: "/legacy/2023-future-fest.jpeg" },
    { year: "2024", event: "Participation at Kazan Forum, Russia", image: "/legacy/2024-kazan.jpeg" },
    { year: "2024", event: "Participation at IVS Kyoto, Japan", image: "/legacy/2024-kyoto.png" },
    { year: "2024", event: "Pakistan Tech Summit, Riyadh, Saudi Arabia", image: "/legacy/2024-riyadh.jpeg" },
    { year: "2024", event: "Pakistan Tech Summit, Oslo, Norway", image: "/legacy/2024-oslo.webp" },
    { year: "2024", event: "Participation at IFA Berlin, Germany", image: "/legacy/2022-ifa-berlin.png" },
    { year: "2024", event: "Future Fest", image: "/legacy/2024-future-fest.jpeg" },
    { year: "2024", event: "Pakistan Tech Summit, Silicon Valley, USA", image: "/legacy/2020-silicon-valley.jpeg" },
    { year: "2024", event: "Pakistan Tech Summit, Dubai", image: "/legacy/2024-dubai.jpg" },
    { year: "2025", event: "Future Fest", image: "/legacy/2025-future-fest.jpg" },
  ];

  const videos = [
    { id: "vpp0UqXHL3U", title: "Pakistan Tech Summit, Norway 2023" },
    { id: "9H3JeFtFULY", title: "Future Fest 2022 Official Aftermovie" },
    { id: "4NJi_29hBHY", title: "Pakistan Tech Summit 2020 - Silicon Valley, USA" },
    { id: "lKcpL1v1Sco", title: "9th Pakistan Tech Summit | Dubai" },
    { id: "Q3_KdY54bMc", title: "Future Fest 2023 Official Aftermovie" },
    { id: "m_03aJUuZqk", title: "Pakistan Tech Summit 2019 - Oslo, Norway" },
    { id: "AIiQB6GoRrM", title: "11th Pakistan Tech Summit, Riyadh" },
    { id: "RD0le4EYjnE", title: "Future Fest 2024 Official Aftermovie" },
  ];

  const pastEvents = [
    {
      title: "Pakistan Innovation Roadshow 2021",
      date: "1 – 20 March 2021 | Pakistan",
      image: "/past-events/innovation-roadshow.avif",
      description: "The tech ecosystem of Pakistan is booming and Ejad Labs is super excited to bring you a one-of-a-kind roadshow, celebrating tech innovation and the extraordinary minds behind it. We're taking the roadshow to 15 cities of Pakistan and will be featuring the best of the best from each of these cities. Action-packed with learning, thought-provoking insightful conversations, networking and much more!"
    },
    {
      title: "PAK-US Tech Exchange - Silicon Valley",
      image: "/past-events/pak-us-exchange.avif",
      description: "Our flagship immersion program into the Silicon Valley ecosystem, designed to fast track you and your business. Join a select cohort of digital leaders, gain insight from globally-known founders and investors and implement that wisdom into your professional journey. Previous programs have featured 100+ participants."
    },
    {
      title: "Pakistan Tech Summit",
      image: "/past-events/tech-summit.avif",
      description: "We organize a global series of conferences to celebrate Pakistani startups, innovators and inventors working on disruptive technologies around the globe. The previous events have brought together 500+ entrepreneurs, technology experts and investors from all walks of life in Silicon Valley, USA and Oslo, Norway."
    },
    {
      title: "Startup Grind Pakistan Conference",
      image: "/past-events/startup-grind.avif",
      description: "Pakistan's flagship technology and startup conference bringing together the nation's top 3000 founders and thought leaders, for conversations, collaborations and actions around the role of technology for the future of Pakistan. The previous conference featured 80+ speakers from around the world and 1500 attendees."
    },
    {
      title: "Startup Growth Series",
      image: "/past-events/growth-series.avif",
      description: "AWS has collaborated with Ejad Labs to create Pakistan's most definitive virtual program to solve some of the biggest challenges founders face today. This is a first-of-its-kind immersive learning program for founders to gain hands-on knowledge on the fundamentals of scaling from global leaders to help their growth journey. This is a 6-month program."
    },
    {
      title: "Techstars Startup Weekend Women",
      image: "/past-events/startup-weekend-women.avif",
      description: "100+ professionals, students and aspiring entrepreneurs, participated in the three-day marathon where they connected, shared and came up with new ideas by attending curated workshops and mentorship sessions."
    },
    {
      title: "Womenwill Leadership Summit",
      image: "/past-events/womenwill.avif",
      description: "150 women leaders participated in the day-long event filled with keynotes, discussions, hands-on workshops featuring 15 speakers and experts, and networking focused on helping women reach their leadership goals."
    },
    {
      title: "GBG BizFest",
      image: "/past-events/bizfest.avif",
      description: "300+ Participants learned how to use Google products and technologies to start and scale their businesses and develop themselves through capacity building workshops from 25 top speakers and trainers from across Pakistan."
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <UnifiedHeader />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative py-20 md:py-32 overflow-hidden">
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ 
              backgroundImage: 'url(/past-events/hero.webp)',
              filter: 'brightness(0.3)'
            }}
          />
          <div className="container mx-auto px-4 relative z-10">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white text-center mb-6">
              Our Legacy
            </h1>
            <p className="text-lg md:text-xl text-white/90 text-center max-w-4xl mx-auto mb-4">
              Ejad Labs creates and curates content for business leaders building a more sustainable, socially-conscious global economy.
            </p>
            <p className="text-base md:text-lg text-white/80 text-center max-w-3xl mx-auto font-medium">
              Through our global resources, international programs, large-scale summits and community events, we support entrepreneurs and intrapreneurs at every stage of their journey.
            </p>
          </div>
        </section>

        {/* Timeline Events Grid */}
        <section className="py-16 md:py-24 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-4">
              Event Timeline
            </h2>
            <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
              A visual journey through our global initiatives and groundbreaking events from 2018 to 2025
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {legacyEvents.map((item, index) => (
                <div 
                  key={index}
                  className="group relative overflow-hidden rounded-lg bg-card border hover:shadow-lg transition-all duration-300"
                >
                  <div className="aspect-[4/3] overflow-hidden">
                    <img 
                      src={item.image} 
                      alt={`${item.year} - ${item.event}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-4">
                    <p className="text-lg font-bold text-primary mb-1">{item.year}</p>
                    <p className="text-sm text-muted-foreground">{item.event}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Video Highlights */}
        <section className="py-16 md:py-24 bg-background">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-4">
              Event Highlights
            </h2>
            <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
              Watch the moments that defined our journey - from tech summits to innovation festivals
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {videos.map((video, index) => (
                <div 
                  key={index} 
                  className="overflow-hidden rounded-lg border-2 hover:border-primary/40 transition-all duration-300 hover:shadow-lg"
                >
                  <div className="aspect-video">
                    <iframe
                      src={`https://www.youtube.com/embed/${video.id}`}
                      title={video.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full"
                    />
                  </div>
                  <div className="p-4 bg-card">
                    <p className="text-sm font-medium">{video.title}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Past Events in Detail */}
        <section className="py-16 md:py-24 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-4">
              Past Events
            </h2>
            <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
              Detailed look at our signature programs and community initiatives
            </p>
            
            <div className="max-w-4xl mx-auto space-y-12">
              {pastEvents.map((event, index) => (
                <div 
                  key={index}
                  className="bg-card rounded-lg overflow-hidden border hover:shadow-lg transition-shadow duration-300"
                >
                  <div className="md:flex">
                    <div className="md:w-2/5">
                      <img 
                        src={event.image} 
                        alt={event.title}
                        className="w-full h-64 md:h-full object-cover"
                      />
                    </div>
                    <div className="md:w-3/5 p-6 md:p-8">
                      <h3 className="text-2xl font-bold mb-2">{event.title}</h3>
                      {event.date && (
                        <p className="text-sm font-semibold text-primary mb-4">{event.date}</p>
                      )}
                      <p className="text-muted-foreground leading-relaxed">{event.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      
      <UnifiedFooter />
    </div>
  );
};

export default Legacy;
