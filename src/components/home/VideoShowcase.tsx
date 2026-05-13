import { useState } from "react";

const VideoShowcase = () => {
  const videos = [
    { id: "Z8NhmtGfTXU", title: "Arab News Coverage", description: "Arab News Pakistan Feature" },
    { id: "zdYVHed_Xmk", title: "Tech Innovation Feature", description: "Featured Coverage" },
    { id: "_9tavmMaIuM", title: "Voice of America Feature", description: "VOA Urdu Coverage" }
  ];

  const [loaded, setLoaded] = useState<Record<number, boolean>>({});

  return (
    <section className="section-padding bg-background">
      <div className="container mx-auto px-5 sm:px-6">
        <div className="text-center mb-10 md:mb-12">
          <h2 className="mb-2">Featured in Media</h2>
          <p className="text-muted-foreground text-sm sm:text-base mx-auto">
            Watch our coverage from leading news outlets and tech conferences
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5 lg:gap-6 max-w-5xl mx-auto">
          {videos.map((video, index) => (
            <div key={index} className="overflow-hidden rounded-lg border border-border/50 bg-card">
              <div className="relative aspect-video bg-muted">
                {!loaded[index] && (
                  <button
                    onClick={() => setLoaded(prev => ({ ...prev, [index]: true }))}
                    className="absolute inset-0 flex items-center justify-center group min-h-0 min-w-0"
                    aria-label={`Play ${video.title}`}
                  >
                    <img
                      src={`https://img.youtube.com/vi/${video.id}/hqdefault.jpg`}
                      alt={video.title}
                      loading="lazy"
                      decoding="async"
                      width={480}
                      height={360}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="relative z-10 w-14 h-14 rounded-full bg-primary/90 flex items-center justify-center group-hover:bg-primary transition-colors shadow-lg">
                      <svg className="w-5 h-5 text-primary-foreground ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </button>
                )}
                {loaded[index] && (
                  <iframe
                    src={`https://www.youtube.com/embed/${video.id}?autoplay=1`}
                    title={video.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  />
                )}
              </div>
              <div className="p-3">
                <h3 className="font-medium text-sm mb-0.5">{video.title}</h3>
                <p className="text-xs text-muted-foreground">{video.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-6">
          <a
            href="https://www.youtube.com/@FutureFestpk"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:text-primary-dark font-medium text-sm underline underline-offset-4 transition-colors"
          >
            View More on YouTube →
          </a>
        </div>
      </div>
    </section>
  );
};

export default VideoShowcase;
