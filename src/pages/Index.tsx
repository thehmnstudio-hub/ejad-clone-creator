import { lazy, Suspense } from "react";
import UnifiedHeader from "@/components/UnifiedHeader";
import OrganizationHero from "@/components/home/OrganizationHero";

// Below-fold sections — lazy so the homepage only ships header + hero.
const ServicesOverview = lazy(() => import("@/components/home/ServicesOverview"));
const PhotoGallery = lazy(() => import("@/components/home/PhotoGallery"));
const ImpactStats = lazy(() => import("@/components/home/ImpactStats"));
const VisaSuccessStories = lazy(() => import("@/components/visa/VisaSuccessStories"));
const VideoShowcase = lazy(() => import("@/components/home/VideoShowcase"));
const FeaturedMedia = lazy(() => import("@/components/inc/FeaturedMedia"));
const BrandPartners = lazy(() => import("@/components/BrandPartners"));
const UnifiedFooter = lazy(() => import("@/components/UnifiedFooter"));

const Placeholder = ({ minH = 320 }: { minH?: number }) => (
  <div style={{ minHeight: minH }} />
);

const Defer = ({ minH = 320, children }: { minH?: number; children: React.ReactNode }) => (
  <div style={{ contentVisibility: "auto" as any, containIntrinsicSize: `${minH}px` }}>
    <Suspense fallback={<Placeholder minH={minH} />}>{children}</Suspense>
  </div>
);

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <UnifiedHeader />
      <main className="flex-grow">
        <OrganizationHero />
        <Defer minH={500}><ServicesOverview /></Defer>
        <Defer minH={500}><PhotoGallery /></Defer>
        <Defer minH={300}><ImpactStats /></Defer>
        <Defer minH={500}><VisaSuccessStories /></Defer>
        <Defer minH={400}><VideoShowcase /></Defer>
        <Defer minH={300}><FeaturedMedia /></Defer>
        <Defer minH={400}><BrandPartners /></Defer>
        <Defer minH={300}><UnifiedFooter /></Defer>
      </main>
    </div>
  );
};
export default Index;