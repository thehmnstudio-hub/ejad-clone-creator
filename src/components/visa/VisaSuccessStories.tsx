import { Card, CardContent } from "@/components/ui/card";

const VisaSuccessStories = () => {
  const testimonials = [
    { name: "Fasieh Mehta", organization: "Google", testimonial: "Ejad Labs made the entire process quick and stress-free for me", image: "/testimonials/visa/faseh-mehta.avif", logo: "/brands/google-logo.png" },
    { name: "Habib Ullah Khan", organization: "Penumbra", testimonial: "Visa Desk made my visa application process incredibly straightforward and stress-free.", image: "/testimonials/visa/habib-ullah-khan.avif", logo: "/brands/penumbra-logo.webp" },
    { name: "Roshaan Shiekh", organization: "Stripple", testimonial: "The team at Visa Desk guided us every step of the way, ensuring our success.", image: "/testimonials/visa/roshaan-shiekh.avif", logo: "/brands/stripple-logo.webp" },
    { name: "Yasir Shaukat", organization: "Techleadz", testimonial: "Ejad Labs Visa Desk handled everything efficiently and smoothly.", image: "/testimonials/visa/yasir-shaukat.avif", logo: "/brands/techleadz-logo.jpg" },
    { name: "Haseeb Khan", organization: "Tkxel", testimonial: "Thanks to Ejad Labs, my visa process was seamless and hassle-free.", image: "/testimonials/visa/haseeb-khan.avif", logo: "/brands/tkxel-logo.jpeg" },
    { name: "Muhammad Umar", organization: "Relymer Group", testimonial: "Quick, professional, and reliable – Ejad Labs Visa Desk was exceptional.", image: "/testimonials/visa/muhammad-umar.avif", logo: "/brands/relymer-logo.jpg" },
    { name: "Mohsin Qureshi", organization: "Mithu", testimonial: "Exceptional service! Ejad Labs took care of all the details effortlessly.", image: "/testimonials/visa/mohsin-qureshi.avif", logo: "/brands/mithu-logo.jpeg" },
    { name: "Muhammad Hilal", organization: "Section Soft", testimonial: "I couldn't have asked for an easier visa experience with Ejad Labs.", image: "/testimonials/visa/muhammad-hilal.avif", logo: "/brands/sectionsoft-logo.jpg" },
    { name: "Asif Chauhdry", organization: "Mountainise Inc", testimonial: "With Ejad Labs, the visa process was fast and easy from start to finish.", image: "/testimonials/visa/asif-chauhdry.avif", logo: "/brands/mountainise-logo.avif" }
  ];

  return (
    <section className="section-padding-sm bg-secondary/30">
      <div className="container mx-auto px-5 sm:px-6">
        <div className="text-center mb-8 md:mb-10">
          <h2 className="mb-2">Real Stories, Real Results</h2>
          <p className="text-muted-foreground text-sm sm:text-base mx-auto max-w-xl">
            We're proud to have helped countless professionals successfully navigate the U.S. and EU visa processes
          </p>
        </div>

        {/* CSS scroll-snap carousel (no JS): horizontal swipe on mobile, grid on desktop */}
        <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-none -mx-4 px-4 max-w-4xl mx-auto md:grid md:grid-cols-3 md:gap-4 md:overflow-visible md:mx-auto md:px-0">
          {testimonials.map((t, index) => (
            <Card key={index} className="text-center h-full border border-border/50 bg-card shrink-0 w-[85%] md:w-auto snap-center">
              <CardContent className="p-5 flex flex-col h-full">
                <div className="w-16 h-16 rounded-full overflow-hidden mx-auto mb-3 border border-border">
                  <img src={t.image} alt={t.name} loading="lazy" decoding="async" width={64} height={64} className="w-full h-full object-cover" />
                </div>
                <h3 className="font-semibold text-sm mb-1">{t.name}</h3>
                <div className="h-8 flex items-center justify-center mb-2">
                  <img src={t.logo} alt={t.organization} loading="lazy" decoding="async" className="max-h-6 max-w-[80px] object-contain opacity-60" />
                </div>
                <p className="text-xs text-muted-foreground mb-2">{t.organization}</p>
                <p className="text-xs italic text-muted-foreground mt-auto leading-relaxed">"{t.testimonial}"</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default VisaSuccessStories;
