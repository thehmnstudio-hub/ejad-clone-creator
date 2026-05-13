const media = [
  { name: "Express News",     src: "/logos/express-news.webp",    w: 428, h: 184, link: "https://www.youtube.com/watch?v=LNDPw_dep1w&ab_channel=ExpressNews" },
  { name: "Voice of America", src: "/logos/voa.webp",             w: 345, h: 194, link: "https://www.youtube.com/watch?v=_9tavmMaIuM&t=36s&ab_channel=VOAURDU" },
  { name: "Arab News",        src: "/logos/arab-news.webp",       w: 500, h: 78,  link: "https://www.youtube.com/watch?v=Z8NhmtGfTXU&ab_channel=ArabNewsPK" },
  { name: "Express Tribune",  src: "/logos/express-tribune.webp", w: 351, h: 94,  link: "https://tribune.com.pk/story/2359364/future-fest-founder-arzish-azam-represents-pakistan-at-bsv-global-blockchain-convention-in-dubai" },
];

const FeaturedMedia = () => {
  return (
    <section className="py-6 md:py-8 bg-secondary/40">
      <div className="container mx-auto px-5 sm:px-6">
        <div className="text-center mb-4 md:mb-6">
          <h2 className="mb-0 text-xl md:text-2xl">Media Highlights</h2>
          <p className="text-muted-foreground text-xs md:text-sm">Featured by global publications</p>
        </div>

        {/* Same uniform-box system as GlobalServices for visual consistency */}
        {/* 2x2 grid via basis-[42%] — keeps news logos at a confident size
            without sprawling into a single thin row */}
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6 md:gap-x-16 md:gap-y-8 max-w-5xl mx-auto">
          {media.map((outlet) => {
            const aspect = outlet.w / outlet.h;
            return (
              <a
                key={outlet.name}
                href={outlet.link}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={outlet.name}
                className="h-12 md:h-16 basis-[42%] md:basis-[40%] max-w-[260px] flex items-center justify-center hover:opacity-80 transition-opacity"
              >
                <img
                  src={outlet.src}
                  alt={outlet.name}
                  width={Math.round(64 * aspect)}
                  height={64}
                  loading="lazy"
                  decoding="async"
                  className="max-h-full max-w-full w-auto h-auto object-contain"
                />
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturedMedia;
