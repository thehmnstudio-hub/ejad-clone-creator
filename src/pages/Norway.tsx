import UnifiedHeader from "@/components/UnifiedHeader";
import UnifiedFooter from "@/components/UnifiedFooter";
import { Button } from "@/components/ui/button";

const Norway = () => {
  return (
    <div className="min-h-screen">
      <UnifiedHeader />
      <main>
        <section className="py-16 md:py-24 bg-gradient-to-b from-primary/5 to-background">
          <div className="container mx-auto px-4 text-center max-w-3xl">
            <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold tracking-wide uppercase mb-4">
              Oslo Innovation Week · 2026
            </span>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Norway Tech Exchange
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Join Pakistan's premier delegation to Oslo Innovation Week — content for this page is coming soon.
            </p>
            <Button size="lg" asChild>
              <a href="mailto:hello@ejadlabs.com">Express Interest</a>
            </Button>
          </div>
        </section>

        <section className="py-12 md:py-16 bg-background">
          <div className="container mx-auto px-4 text-center max-w-2xl">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">More details coming soon</h2>
            <p className="text-muted-foreground">
              We're putting the finishing touches on the program. Reach out at{" "}
              <a href="mailto:hello@ejadlabs.com" className="text-primary hover:underline">
                hello@ejadlabs.com
              </a>{" "}
              for the latest information.
            </p>
          </div>
        </section>
      </main>
      <UnifiedFooter />
    </div>
  );
};

export default Norway;