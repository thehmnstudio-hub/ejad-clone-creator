import { lazy, Suspense } from "react";
import UnifiedHeader from "@/components/UnifiedHeader";
import IncHero from "@/components/inc/IncHero";

// Below-fold sections — lazy so /inc landing only ships header + hero.
const GlobalServices = lazy(() => import("@/components/inc/GlobalServices"));
const FeaturedMedia = lazy(() => import("@/components/inc/FeaturedMedia"));
const IncPortfolio = lazy(() => import("@/components/inc/IncPortfolio"));
const HowItWorks = lazy(() => import("@/components/inc/HowItWorks"));
const PricingSection = lazy(() => import("@/components/inc/PricingSection"));
const ApplicationForm = lazy(() => import("@/components/inc/ApplicationForm"));
const FAQSection = lazy(() => import("@/components/inc/FAQSection"));
const UnifiedFooter = lazy(() => import("@/components/UnifiedFooter"));

const Placeholder = ({ minH = 320 }: { minH?: number }) => (
  <div style={{ minHeight: minH }} />
);

// content-visibility:auto skips layout/paint for off-screen sections, fixing
// the 25s Speed Index. contain-intrinsic-size reserves height to prevent CLS.
const Defer = ({ minH = 320, children }: { minH?: number; children: React.ReactNode }) => (
  <div style={{ contentVisibility: "auto" as any, containIntrinsicSize: `${minH}px` }}>
    <Suspense fallback={<Placeholder minH={minH} />}>{children}</Suspense>
  </div>
);

const INC = () => {
  return (
    <div className="min-h-screen">
      <UnifiedHeader />
      <IncHero />
      <Defer minH={400}><GlobalServices /></Defer>
      <Defer minH={400}><FeaturedMedia /></Defer>
      <Defer minH={500}><IncPortfolio /></Defer>
      <Defer minH={500}><HowItWorks /></Defer>
      <Defer minH={600}><PricingSection /></Defer>
      <Defer minH={700}><ApplicationForm /></Defer>
      <Defer minH={400}><FAQSection /></Defer>
      <Defer minH={300}><UnifiedFooter /></Defer>
    </div>
  );
};

export default INC;
