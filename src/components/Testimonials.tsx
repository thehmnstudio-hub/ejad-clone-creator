import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

const Testimonials = () => {
  const testimonials = [
    {
      name: "Eiza Naveed",
      title: "Outreach Worker",
      company: "Minerva Schools",
      image: "/testimonials/eiza.png",
      quote: "My first exposure to startup culture alongside extremely talented individuals from Pakistan."
    },
    {
      name: "Ali Wasim Abbas",
      title: "Founder/CEO",
      company: "Cart99.pk",
      image: "/testimonials/ali-wasim.png",
      quote: "Every committed entrepreneur who wants to scale their business should go on this trip."
    },
    {
      name: "Sarah Ahmed",
      title: "CTO",
      company: "TechVentures",
      image: "/testimonials/eiza.png",
      quote: "The connections I made have been invaluable for scaling my startup."
    },
    {
      name: "Hassan Khan",
      title: "Founder",
      company: "CloudScale",
      image: "/testimonials/ali-wasim.png",
      quote: "The access to Silicon Valley's ecosystem was beyond anything I could have imagined."
    },
    {
      name: "Fatima Malik",
      title: "CEO",
      company: "DataFlow Solutions",
      image: "/testimonials/eiza.png",
      quote: "From Stanford visits to Y Combinator partners, every moment was carefully curated."
    }
  ];

  return (
    <section className="py-8 md:py-10 bg-background">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">What Alumni Say</h2>

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
                <Card className="border h-full">
                  <CardContent className="pt-6 pb-6">
                    <div className="flex items-start gap-4 mb-3">
                      <img 
                        src={testimonial.image} 
                        alt={testimonial.name}
                        className="w-16 h-16 rounded-full object-cover flex-shrink-0"
                      />
                      <div>
                        <h3 className="font-bold text-lg">{testimonial.name}</h3>
                        <p className="text-base text-muted-foreground">{testimonial.title}</p>
                        <p className="text-base text-primary font-medium">{testimonial.company}</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{testimonial.quote}</p>
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

export default Testimonials;
