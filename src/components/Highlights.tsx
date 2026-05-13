import OptimizedImage from "@/components/OptimizedImage";

const Highlights = () => {
  const highlights = [
    "/highlights/highlight1.jpg",
    "/highlights/highlight2.png",
    "/highlights/highlight3.jpg",
    "/highlights/highlight4.jpg",
    "/highlights/highlight5.jpg",
    "/highlights/highlight6.jpg",
  ];

  return (
    <section className="py-8 md:py-10 bg-muted/50">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-6">Program Highlights</h2>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 max-w-5xl mx-auto">
          {highlights.map((image, index) => (
            <div key={index} className="aspect-video rounded-lg overflow-hidden">
              <OptimizedImage
                src={image} 
                alt={`Program highlight ${index + 1}`}
                width={600}
                height={338}
                responsive
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Highlights;
