import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

const PartnersCarousel = () => {
  const partners = [
    { name: "Stanford", logo: "/partners/stanford-logo.png" },
    { name: "500 Startups", logo: "/partners/500startups-logo.png" },
    { name: "Uber", logo: "/partners/uber-logo.png" },
    { name: "Airbnb", logo: "/partners/airbnb-logo.png" },
    { name: "Draper University", logo: "/partners/draper-university-logo.png" },
    { name: "StartX", logo: "/partners/startx-logo.png" },
  ];

  return (
    <section className="py-8 md:py-10 bg-background">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">Meet Silicon Valley</h2>

        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          plugins={[
            Autoplay({
              delay: 5000,
              stopOnInteraction: true,
              stopOnMouseEnter: true,
            }),
          ]}
          className="w-full max-w-5xl mx-auto"
        >
          <CarouselContent>
            {partners.map((partner, index) => (
              <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                <div className="flex items-center justify-center p-8">
                  <img 
                    src={partner.logo} 
                    alt={partner.name}
                    className="h-12 md:h-16 object-contain opacity-70 hover:opacity-100 transition-opacity"
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
    </section>
  );
};

export default PartnersCarousel;
