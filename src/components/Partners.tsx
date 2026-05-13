import OptimizedImage from "@/components/OptimizedImage";

const Partners = () => {
  return (
    <section className="py-8 md:py-10 bg-background">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-6">Partner Organizations</h2>

        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-8 md:gap-12 items-center max-w-6xl mx-auto opacity-70">
          <OptimizedImage src="/partners/stanford-logo.png" alt="Stanford" width={160} height={64} className="h-12 md:h-16 object-contain mx-auto" />
          <OptimizedImage src="/partners/500startups-logo.png" alt="500 Startups" width={160} height={64} className="h-12 md:h-16 object-contain mx-auto" />
          <OptimizedImage src="/partners/uber-logo.png" alt="Uber" width={160} height={64} className="h-12 md:h-16 object-contain mx-auto" />
          <OptimizedImage src="/partners/airbnb-logo.png" alt="Airbnb" width={160} height={64} className="h-12 md:h-16 object-contain mx-auto" />
          <OptimizedImage src="/partners/draper-university-logo.png" alt="Draper University" width={160} height={64} className="h-12 md:h-16 object-contain mx-auto" />
          <OptimizedImage src="/partners/startx-logo.png" alt="StartX" width={160} height={64} className="h-12 md:h-16 object-contain mx-auto" />
        </div>
      </div>
    </section>
  );
};

export default Partners;
