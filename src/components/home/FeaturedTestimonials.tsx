import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

const FeaturedTestimonials = () => {
  const testimonials = [
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
    <section className="py-12 md:py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">Success Stories</h2>
          <p className="text-muted-foreground text-sm md:text-base">
            Hear from entrepreneurs who've transformed their businesses through our programs
          </p>
        </div>

        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          plugins={[
            Autoplay({
              delay: 4000,
            }),
          ]}
          className="w-full max-w-5xl mx-auto"
        >
          <CarouselContent>
            {testimonials.map((testimonial, index) => (
              <CarouselItem key={index} className="md:basis-1/2">
                <Card className="border-2 h-full">
                  <CardContent className="pt-6 pb-6">
                    <div className="flex items-center gap-4 mb-4">
                      <img 
                        src={testimonial.image} 
                        alt={testimonial.name}
                        className="w-20 h-20 rounded-full object-cover border-2 border-primary/20"
                      />
                      <div>
                        <h3 className="font-bold text-lg">{testimonial.name}</h3>
                        <p className="text-sm text-muted-foreground">{testimonial.title}</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground italic">"{testimonial.quote}"</p>
                  </CardContent>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden md:flex" />
          <CarouselNext className="hidden md:flex" />
        </Carousel>
      </div>
    </section>
  );
};

export default FeaturedTestimonials;
