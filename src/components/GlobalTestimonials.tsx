// Pure CSS scroll-snap carousel — no embla, no autoplay, no JS.
// Saves the ~110KB carousel-vendor chunk on initial load and removes
// 789ms of bootup time on mobile (per Lighthouse).
import { Card, CardContent } from "@/components/ui/card";
import { Quote } from "lucide-react";

const GlobalTestimonials = () => {
  // Testimonial photos render at 96-128px — load the small 400w webp variant
  const toSmallSrc = (path: string) => path.replace(/\.(png|jpe?g|webp)$/i, "-400w.webp");

  const testimonials = [
    {
      name: "Yasir Shaukat",
      title: "Founder, Techi247 LLC",
      image: "/testimonials/yasir-shaukat.jpeg",
      quote: "Ejad Labs created a perfect blend of networking, learning, and exposure. From engaging discussions with top investors to visiting global tech hubs, the experience has reshaped my understanding of innovation and entrepreneurship. I highly recommend this program."
    },
    {
      name: "Talal Burny",
      title: "Manager Global Product, DEEL",
      image: "/testimonials/talal-burny.jpeg",
      quote: "Being part of the Ejad Labs delegation was nothing short of extraordinary. The opportunity to learn from some of the most influential minds in tech and engage in meaningful conversations about the future of business has been a major boost to my entrepreneurial journey"
    },
    {
      name: "Ahmed Khalid Waqas",
      title: "Founder, Quality Resource",
      image: "/testimonials/ahmed-khalid-waqas.jpg",
      quote: "Ejad Labs provided a rare opportunity to engage with top innovators and business leaders in Silicon Valley. The networking, knowledge sharing, and business exposure I gained have been instrumental in refining my strategic approach. I'm grateful for this life-changing experience."
    },
    {
      name: "Muhammad Umar",
      title: "CEO, Relymer Group",
      image: "/testimonials/muhammad-umar.jpeg",
      quote: "Joining Ejad Labs was a turning point for me. The connections I made, the knowledge I gained, and the mentorship I received have been crucial for my growth. This program is an absolute must for entrepreneurs looking to expand internationally."
    },
    {
      name: "Samar Hasan",
      title: "Director Sustainability & Investor Relations EcoEdge A",
      image: "/testimonials/samar-hasan.jpeg",
      quote: "Traveling with Ejad Global was an exceptional experience. The visa process was incredibly smooth, thanks to their efficient team. They made sure everything was handled perfectly. I highly recommend Ejad Global for their professionalism and support."
    },
    {
      name: "Inamullah Abdullah",
      title: "COO A.A. Joyland Pvt. Ltd",
      image: "/testimonials/inamullah-abdullah.jpeg",
      quote: "Attending Ejad Labs' program was a game-changer. From meeting top executives at tech giants to participating in discussions, the experience expanded my perspective on innovation & business growth. I highly recommend this initiative for aspiring entrepreneurs."
    },
    {
      name: "Asim Jamil",
      title: "CEO Tracking KSA",
      image: "/testimonials/asim-jamil.jpeg",
      quote: "Ejad Labs exceeded all my expectations. The access to Silicon Valley's top investors and incubators, combined with practical exposure to disruptive technologies, was an eye-opener. This experience has significantly shaped my entrepreneurial journey."
    },
    {
      name: "Asif Sajjad",
      title: "CEO Dailar360 / Voipmen Pvt. Ltd.",
      image: "/testimonials/asif-sajjad.jpeg",
      quote: "Attending Ejad Labs' program was a game-changer. From meeting top executives at tech giants to participating in discussions, the experience expanded my perspective on innovation & business growth. I highly recommend this initiative for aspiring entrepreneurs."
    }
  ];

  return (
    <section className="py-16 md:py-24 bg-background" style={{ contentVisibility: "auto", containIntrinsicSize: "1px 600px" }}>
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-12">
          Testimonials
        </h2>

        <div
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-4 -mx-4 px-4 max-w-5xl mx-auto"
          style={{ scrollbarWidth: "thin" }}
        >
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="snap-start shrink-0 w-[85%] sm:w-[48%] lg:w-[32%]"
            >
              <Card className="h-full">
                <CardContent className="p-6 flex flex-col h-full">
                  <Quote className="h-8 w-8 text-primary mb-4" />
                  <p className="text-muted-foreground mb-6 flex-grow text-sm leading-relaxed">
                    {testimonial.quote}
                  </p>
                  <div className="flex items-center gap-4 mt-auto">
                    <img
                      src={toSmallSrc(testimonial.image)}
                      alt={testimonial.name}
                      loading="lazy"
                      decoding="async"
                      width={128}
                      height={128}
                      className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-2 border-primary/20 flex-shrink-0"
                    />
                    <div>
                      <p className="font-semibold text-base">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.title}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default GlobalTestimonials;
