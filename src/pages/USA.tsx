import { lazy, Suspense } from "react";
import UnifiedHeader from "@/components/UnifiedHeader";
import Hero from "@/components/Hero";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// Lazy-load EVERYTHING below the hero — only Hero + Header are eager.
// `content-visibility: auto` on each <Suspense> wrapper tells the browser to
// skip layout/paint until the section scrolls into view (Speed Index win).
const ProgramOverview = lazy(() => import("@/components/ProgramOverview"));
const Stats = lazy(() => import("@/components/Stats"));
const Highlights = lazy(() => import("@/components/Highlights"));
const ApprovedDelegates = lazy(() => import("@/components/ApprovedDelegates"));
const ProgramDescription = lazy(() => import("@/components/apply/ProgramDescription"));
const ProgramTimeline = lazy(() => import("@/components/apply/ProgramTimeline"));
const ProgramSchedule = lazy(() => import("@/components/apply/ProgramSchedule"));
const ProgramCosts = lazy(() => import("@/components/apply/ProgramCosts"));
const ApplicationForm = lazy(() => import("@/components/apply/ApplicationForm"));
const FAQ = lazy(() => import("@/components/apply/FAQ"));
const GlobalTestimonials = lazy(() => import("@/components/GlobalTestimonials"));
const UnifiedFooter = lazy(() => import("@/components/UnifiedFooter"));

// Reserve realistic height per section so the page never reflows during streaming.
// `content-visibility: auto` + matching contain-intrinsic-size = browser can skip
// layout/paint of off-screen content entirely until scrolled into view.
const Placeholder = ({ minH = 320 }: { minH?: number }) => (
  <div style={{ minHeight: minH }} className="flex items-center justify-center" aria-hidden>
    <div className="h-6 w-6 rounded-full border-2 border-primary/20 border-t-primary/50 animate-spin opacity-50" />
  </div>
);

const Defer = ({ minH = 320, children }: { minH?: number; children: React.ReactNode }) => (
  <div style={{ contentVisibility: "auto", containIntrinsicSize: `1px ${minH}px` }}>
    <Suspense fallback={<Placeholder minH={minH} />}>{children}</Suspense>
  </div>
);

const USA = () => {
  return <div className="min-h-screen">
      <UnifiedHeader />
      <Hero />
      <Defer minH={180}><ProgramOverview /></Defer>
      <Defer minH={120}><Stats /></Defer>
      <Defer minH={400}><Highlights /></Defer>
      <Defer minH={600}><ApprovedDelegates /></Defer>

      <section className="py-8 bg-background" style={{ contentVisibility: "auto", containIntrinsicSize: "1px 120px" }}>
        <div className="container mx-auto px-4 text-center">
          <Button 
            asChild
            size="lg"
            className="px-8"
          >
            <a 
              href="https://airtable.com/appQqCB3DvgmuY7nF/shr4OMIR4q7l6l9Rf/tbl3Jcwj3iiJPMrNr" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              View Previous Delegates
            </a>
          </Button>
        </div>
      </section>

      <Defer minH={200}><ProgramDescription /></Defer>

      <section className="py-6 md:py-8 bg-muted/30" style={{ contentVisibility: "auto", containIntrinsicSize: "1px 300px" }}>
        <div className="container mx-auto px-4 max-w-3xl">
          <Accordion type="single" collapsible className="space-y-3 md:space-y-4">
            <AccordionItem value="learn" className="border rounded-lg px-4 md:px-6">
              <AccordionTrigger className="text-base md:text-lg font-bold hover:no-underline py-3 md:py-4">
                What You'll Learn
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pt-2 pb-4">
                <ul className="space-y-1.5 md:space-y-2 list-disc pl-5 text-sm md:text-base">
                  <li>Design thinking & product development</li>
                  <li>Fundraising & investor pitching</li>
                  <li>Global scaling strategies</li>
                  <li>Innovation & tech trends</li>
                  <li>SF & LA tech ecosystem networking</li>
                  <li>Leadership best practices</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="looking" className="border rounded-lg px-4 md:px-6">
              <AccordionTrigger className="text-base md:text-lg font-bold hover:no-underline py-3 md:py-4">
                Who Should Apply
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pt-2 pb-4">
                <ul className="space-y-1.5 md:space-y-2 list-disc pl-5 text-sm md:text-base">
                  <li>Startup founders with traction</li>
                  <li>Tech professionals & IT leaders</li>
                  <li>Students with relevant experience</li>
                  <li>Corporate & government professionals</li>
                  <li>No age limit</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      <Defer minH={400}><ProgramTimeline /></Defer>
      <Defer minH={600}><ProgramSchedule /></Defer>
      <Defer minH={300}><ProgramCosts /></Defer>
      <Defer minH={400}><GlobalTestimonials /></Defer>
      <Defer minH={600}><ApplicationForm /></Defer>
      <Defer minH={400}><FAQ /></Defer>
      <Defer minH={300}><UnifiedFooter /></Defer>
    </div>;
};
export default USA;