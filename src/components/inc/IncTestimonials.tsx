import { Card, CardContent } from "@/components/ui/card";
import { Quote } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { useRef } from "react";
import Autoplay from "embla-carousel-autoplay";

const IncTestimonials = () => {
  const plugin = useRef(
    Autoplay({ delay: 6000, stopOnInteraction: true, stopOnMouseEnter: true })
  );
  const testimonials = [
    {
      name: "Azhar Iqbal",
      title: "CEO, RankSol Technologies",
      image: "/testimonials/home/zeeshan-khan.webp",
      quote: "Highly satisfied with the service and quick issue resolution."
    },
    {
      name: "Naveed Ahmad",
      title: "CEO, Build Estimate",
      image: "/testimonials/home/naveed-ahmed.avif",
      quote: "Quality services for both company registration and travel."
    },
    {
      name: "Haroon Q Raja",
      title: "Founder, PAFL",
      image: "/testimonials/home/haroon-q-raja.webp",
      quote: "Helped many people overcome payment issues from outside Pakistan."
    },
    {
      name: "Sammad Saleem",
      title: "CEO, Digitrends",
      image: "/testimonials/home/sammad.webp",
      quote: "Best service with local support and market understanding."
    },
    {
      name: "Nauman Ali Shah",
      title: "CEO, Sevensol Technologies",
      image: "/testimonials/home/nauman-ali-shah.webp",
      quote: "Leading organization helping IT businesses expand globally."
    },
    {
      name: "Malik Haider Ali",
      title: "Founder, Codemanics",
      image: "/testimonials/home/atif-khan.webp",
      quote: "Excellent service with quick resolution to any issues."
    }
  ];

  return (
    <section id="happy-customers" className="py-12 md:py-16 bg-muted/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">4000+ Happy Customers</h2>
        </div>

        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          plugins={[plugin.current]}
          className="w-full max-w-5xl mx-auto"
        >
          <CarouselContent>
            {testimonials.map((testimonial, index) => (
              <CarouselItem key={index} className="md:basis-1/2">
                <Card className="h-full">
                  <CardContent className="pt-6 pb-6 flex flex-col h-full">
                    <div className="flex items-center gap-4 mb-4">
                      <img 
                        src={testimonial.image} 
                        alt={testimonial.name}
                        loading="lazy"
                        className="w-24 h-24 rounded-full object-cover border-2 border-primary/20"
                      />
                      <div>
                        <h3 className="font-bold text-lg">{testimonial.name}</h3>
                        <p className="text-sm text-muted-foreground">{testimonial.title}</p>
                      </div>
                    </div>
                    <div className="relative flex-1">
                      <Quote className="absolute -top-1 -left-1 w-6 h-6 text-primary/20" />
                      <p className="text-sm text-muted-foreground italic pl-5">
                        "{testimonial.quote}"
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="flex -left-12" />
          <CarouselNext className="flex -right-12" />
        </Carousel>
      </div>
    </section>
  );
};

export default IncTestimonials;
