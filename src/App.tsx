import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import React, { lazy, Suspense, useEffect } from "react";
import ScrollToTop from "./components/ScrollToTop";
import { UTMCapture } from "./components/UTMCapture";
import { HQRedirect } from "./components/HQRedirect";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";

// Shows a reload prompt instead of a blank screen when a lazy chunk fails to load
class ChunkErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-3">
          <p className="text-sm text-muted-foreground">Page failed to load.</p>
          <button className="text-sm text-primary underline" onClick={() => window.location.reload()}>
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Lazy-loaded pages for faster initial load
const Index = lazy(() => import("./pages/Index"));
const USA = lazy(() => import("./pages/USA"));
const SiliconValleySuccess = lazy(() => import("./pages/SiliconValleySuccess"));
const INC = lazy(() => import("./pages/INC"));
const INCSuccess = lazy(() => import("./pages/INCSuccess"));
const INCSuccessOff = lazy(() => import("./pages/INCSuccessOff"));
const Visa = lazy(() => import("./pages/Visa"));
const VisaSuccess = lazy(() => import("./pages/VisaSuccess"));
const Norway = lazy(() => import("./pages/Norway"));
const Germany = lazy(() => import("./pages/Germany"));
const Legacy = lazy(() => import("./pages/Legacy"));
const Contact = lazy(() => import("./pages/Contact"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Unsubscribe = lazy(() => import("./pages/Unsubscribe"));
const Payment = lazy(() => import("./pages/Payment"));
const AdminLogin = lazy(() => import("./pages/admin/Login"));
const AdminLayout = lazy(() => import("./components/admin/AdminLayout"));
const Dashboard = lazy(() => import("./pages/admin/Dashboard"));
const Contacts = lazy(() => import("./pages/admin/Contacts"));
const Calendar = lazy(() => import("./pages/admin/Calendar"));
const Team = lazy(() => import("./pages/admin/Team"));
const Applications = lazy(() => import("./pages/admin/Applications"));
const Tasks = lazy(() => import("./pages/admin/Tasks"));
const Deals = lazy(() => import("./pages/admin/Deals"));
const Finance = lazy(() => import("./pages/admin/Finance"));
const Analytics = lazy(() => import("./pages/admin/Analytics"));
const Changelog = lazy(() => import("./pages/admin/Changelog"));
const Assets = lazy(() => import("./pages/admin/Assets"));
const Leads = lazy(() => import("./pages/admin/Leads"));
const LeadStatuses = lazy(() => import("./pages/admin/LeadStatuses"));
const LeadStages = lazy(() => import("./pages/admin/LeadStages"));
const LeadTypes = lazy(() => import("./pages/admin/LeadTypes"));

const App = () => {
  // Auto-reload once if a stale chunk hash 404s (post-deploy blank screen guard)
  useEffect(() => {
    // Clear the guard after a successful load so future deploys can recover too.
    const clearTimer = window.setTimeout(() => {
      sessionStorage.removeItem("__stale_chunk_reloaded");
    }, 5000);
    const isStale = (msg?: string) =>
      !!msg &&
      (msg.includes("dynamically imported module") ||
        msg.includes("Importing a module script failed") ||
        msg.includes("Failed to fetch") ||
        msg.includes("error loading dynamically imported module"));
    const reloadOnce = () => {
      const k = "__stale_chunk_reloaded";
      if (sessionStorage.getItem(k)) return;
      sessionStorage.setItem(k, "1");
      window.location.reload();
    };
    const onRej = (e: PromiseRejectionEvent) => { if (isStale(e.reason?.message)) { e.preventDefault(); reloadOnce(); } };
    const onErr = (e: ErrorEvent) => { if (isStale(e.message) || isStale(e.error?.message)) { e.preventDefault(); reloadOnce(); } };
    window.addEventListener("unhandledrejection", onRej);
    window.addEventListener("error", onErr);
    return () => {
      window.clearTimeout(clearTimer);
      window.removeEventListener("unhandledrejection", onRej);
      window.removeEventListener("error", onErr);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <UTMCapture />
        <HQRedirect />
        <ChunkErrorBoundary>
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/silicon-valley" element={<USA />} />
            <Route path="/silicon-valley/success" element={<SiliconValleySuccess />} />
            <Route path="/inc" element={<INC />} />
            <Route path="/inc/success" element={<INCSuccess />} />
            <Route path="/inc/success-off" element={<INCSuccessOff />} />
            <Route path="/usa" element={<Navigate to="/inc" replace />} />
            <Route path="/visa" element={<Visa />} />
            <Route path="/visa/success" element={<VisaSuccess />} />
            <Route path="/norway" element={<Norway />} />
            <Route path="/germany" element={<Germany />} />
            <Route path="/legacy" element={<Legacy />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/unsubscribe" element={<Unsubscribe />} />
            <Route path="/payment" element={<Payment />} />
            <Route path="/settings/lead-configuration/lead-types" element={<LeadTypes />} />

            {/* Admin Portal */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="contacts" element={<Contacts />} />
              <Route path="applications" element={<Applications />} />
              <Route path="tasks" element={<Tasks />} />
              <Route path="deals" element={<Deals />} />
              <Route path="finance" element={<Finance />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="assets" element={<Assets />} />
              <Route path="changelog" element={<Changelog />} />
              <Route path="calendar" element={<Calendar />} />
              <Route path="team" element={<Team />} />
              <Route path="leads" element={<Leads />} />
              <Route path="settings/lead-configuration/stages" element={<LeadStages />} />
              <Route path="appointments" element={<Navigate to="/admin/calendar" replace />} />
            </Route>

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
        </ChunkErrorBoundary>
      </BrowserRouter>
    </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
