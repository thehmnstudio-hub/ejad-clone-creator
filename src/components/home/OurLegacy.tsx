import OptimizedImage from "@/components/OptimizedImage";

const OurLegacy = () => {
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

  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-12">
          Our Legacy
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {legacyEvents.map((item, index) => (
            <div 
              key={index}
              className="group relative overflow-hidden rounded-lg bg-card border hover:shadow-lg transition-all duration-300"
            >
              <div className="aspect-[4/3] overflow-hidden">
                <OptimizedImage
                  src={item.image} 
                  alt={`${item.year} - ${item.event}`}
                  width={400}
                  height={300}
                  responsive
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
  );
};

export default OurLegacy;
