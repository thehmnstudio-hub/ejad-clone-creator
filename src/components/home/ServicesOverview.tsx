import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const ServicesOverview = () => {
  const programs = [
    { title: "Silicon Valley Tech Exchange", description: "19-day immersive program featuring visits to tech giants and Stanford", image: "/golden-gate.jpg", link: "/silicon-valley", cta: "Learn More" },
    { title: "USA Company Formation", description: "Complete US company setup with physical bank account", image: "/chase-bank.jpg", link: "/inc", cta: "Get Started" },
    { title: "US/EU Visa Consultation", description: "Expert guidance for US and European visa applications", image: "/europe-visa.webp", link: "/visa", cta: "See If You Qualify" }
  ];

  const events = [
    { title: "Future Fest", description: "Pakistan's premier technology and innovation festival", image: "/future-fest.webp", link: "https://www.futurefest.pk", external: true },
    { title: "Pakistan Tech Summit", description: "Annual gathering of Pakistan's tech leaders and innovators", image: "/pakistan-tech-summit.webp", link: "https://www.paktechsummit.com", external: true }
  ];

  const SectionLabel = ({ number, title, subtitle }: { number: string; title: string; subtitle: string }) => (
    <div className="text-center mb-10 md:mb-12">
      <span className="text-primary/60 font-medium text-xs tracking-[0.2em] uppercase">{number}</span>
      <h2 className="mt-1.5 mb-2">{title}</h2>
      <p className="text-muted-foreground max-w-xl mx-auto text-sm sm:text-base">{subtitle}</p>
    </div>
  );

  const ProgramCard = ({ item, index, isExternal }: { item: any; index: number; isExternal?: boolean }) => (
    <Card className="overflow-hidden border border-border/60 hover:border-primary/20 hover:shadow-md transition-all duration-200 flex flex-col bg-card">
      <div className="h-44 md:h-48 overflow-hidden bg-muted">
        <img
          src={item.image}
          alt={item.title}
          loading={index === 0 ? "eager" : "lazy"}
          decoding="async"
          width={400}
          height={200}
          className="w-full h-full object-cover"
        />
      </div>
      <CardHeader className="flex-grow pb-2 pt-5">
        <CardTitle className="text-base md:text-lg mb-1">{item.title}</CardTitle>
        <CardDescription className="text-sm">{item.description}</CardDescription>
      </CardHeader>
      <CardContent className="pt-0 pb-5">
        {isExternal ? (
          <a href={item.link} target="_blank" rel="noopener noreferrer">
            <Button className="w-full min-h-[44px] font-medium" variant="default">Learn More</Button>
          </a>
        ) : (
          <Link to={item.link}>
            <Button className="w-full min-h-[44px] font-medium" variant="default">{item.cta}</Button>
          </Link>
        )}
      </CardContent>
    </Card>
  );

  return (
    <section id="services-section" className="section-padding bg-background scroll-mt-20">
      <div className="container mx-auto px-5 sm:px-6">
        <div className="mb-20 md:mb-24">
          <SectionLabel number="01" title="Programs" subtitle="Comprehensive solutions for Pakistani entrepreneurs looking to expand globally" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6 max-w-5xl mx-auto">
            {programs.map((p, i) => <ProgramCard key={i} item={p} index={i} />)}
          </div>
        </div>

        <div className="mb-20 md:mb-24">
          <SectionLabel number="02" title="Events" subtitle="Large-scale events connecting Pakistan's tech ecosystem" />
          <div className="grid sm:grid-cols-2 gap-5 md:gap-6 max-w-3xl mx-auto">
            {events.map((e, i) => <ProgramCard key={i} item={e} index={i + 3} isExternal />)}
          </div>
        </div>

        <div>
          <SectionLabel number="03" title="Services" subtitle="Professional services to support your global business journey" />
          <div className="grid sm:grid-cols-2 gap-5 md:gap-6 max-w-3xl mx-auto">
            {[
              { title: "Full-Service Event Planning", description: "Large-scale tech events connecting Pakistan's innovation ecosystem", image: "/event-planning.jpg", link: "/contact", cta: "Get in Touch" },
              { title: "Government Relations", description: "Strategic advisory for policy engagement and institutional partnerships", image: "/government-relations.jpg", link: "/contact", cta: "Get in Touch" }
            ].map((s, i) => <ProgramCard key={i} item={s} index={i + 5} />)}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ServicesOverview;
