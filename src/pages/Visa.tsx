import { lazy, Suspense } from "react";
import UnifiedHeader from "@/components/UnifiedHeader";
import VisaHero from "@/components/visa/VisaHero";

// Below-fold sections — lazy so /visa landing only ships header + hero.
const VisaAbout = lazy(() => import("@/components/visa/VisaAbout"));
const FeaturedMedia = lazy(() => import("@/components/inc/FeaturedMedia"));
const VisaSuccessStories = lazy(() => import("@/components/visa/VisaSuccessStories"));
const VisaPortfolio = lazy(() => import("@/components/visa/VisaPortfolio"));
const VisaOptions = lazy(() => import("@/components/visa/VisaOptions"));
const VisaProcess = lazy(() => import("@/components/visa/VisaProcess"));
const VisaPricing = lazy(() => import("@/components/visa/VisaPricing"));
const VisaApplicationForm = lazy(() => import("@/components/visa/VisaApplicationForm"));
const VisaFAQ = lazy(() => import("@/components/visa/VisaFAQ"));
const UnifiedFooter = lazy(() => import("@/components/UnifiedFooter"));

const Placeholder = ({ minH = 320 }: { minH?: number }) => (
  <div style={{ minHeight: minH }} />
);

// content-visibility:auto skips layout/paint for off-screen sections, fixing
// the Speed Index. contain-intrinsic-size reserves height to prevent CLS.
const Defer = ({ minH = 320, children }: { minH?: number; children: React.ReactNode }) => (
  <div style={{ contentVisibility: "auto" as any, containIntrinsicSize: `${minH}px` }}>
    <Suspense fallback={<Placeholder minH={minH} />}>{children}</Suspense>
  </div>
);

const Visa = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <UnifiedHeader />
      <main className="flex-grow">
        <VisaHero />
        <Defer minH={400}><VisaAbout /></Defer>
        <Defer minH={300}><FeaturedMedia /></Defer>
        <Defer minH={500}><VisaSuccessStories /></Defer>
        <Defer minH={600}><VisaPortfolio /></Defer>
        <Defer minH={500}><VisaOptions /></Defer>
        <Defer minH={400}><VisaProcess /></Defer>
        <Defer minH={500}><VisaPricing /></Defer>
        <Defer minH={700}><VisaApplicationForm /></Defer>
        <Defer minH={400}><VisaFAQ /></Defer>
        <Defer minH={300}><UnifiedFooter /></Defer>
      </main>
    </div>
  );
};

export default Visa;
