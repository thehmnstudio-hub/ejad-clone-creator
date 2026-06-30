import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

/* ─── inline keyframes injected once ─── */
const STYLES = `
@keyframes float-slow {
  0%,100% { transform: translateY(0px) translateX(0px) scale(1); }
  33%      { transform: translateY(-40px) translateX(20px) scale(1.05); }
  66%      { transform: translateY(20px) translateX(-15px) scale(0.97); }
}
@keyframes float-med {
  0%,100% { transform: translateY(0px) translateX(0px) scale(1); }
  50%      { transform: translateY(-60px) translateX(30px) scale(1.08); }
}
@keyframes float-fast {
  0%,100% { transform: translateY(0px) rotate(0deg); }
  25%      { transform: translateY(-25px) rotate(5deg); }
  75%      { transform: translateY(15px) rotate(-5deg); }
}
@keyframes fade-up {
  from { opacity:0; transform:translateY(28px); }
  to   { opacity:1; transform:translateY(0); }
}
@keyframes fade-in {
  from { opacity:0; }
  to   { opacity:1; }
}
@keyframes shimmer {
  0%   { background-position: -200% center; }
  100% { background-position:  200% center; }
}
@keyframes pulse-ring {
  0%   { transform:scale(1);   opacity:.6; }
  100% { transform:scale(1.6); opacity:0; }
}
@keyframes draw-check {
  from { stroke-dashoffset:60; }
  to   { stroke-dashoffset:0; }
}
@keyframes pop-in {
  0%   { transform:scale(0);   opacity:0; }
  70%  { transform:scale(1.1); opacity:1; }
  100% { transform:scale(1);   opacity:1; }
}
@keyframes step-slide {
  from { opacity:0; transform:translateX(-20px); }
  to   { opacity:1; transform:translateX(0); }
}
@keyframes count-up {
  0%   { opacity:0; transform:translateY(8px); }
  100% { opacity:1; transform:translateY(0); }
}
@keyframes grain {
  0%,100% { background-position:0 0; }
  10%      { background-position:-5% -10%; }
  30%      { background-position:3% 5%; }
  50%      { background-position:-3% 8%; }
  70%      { background-position:5% -4%; }
  90%      { background-position:-2% 6%; }
}
`;

/* ─── LANDING PAGE ─── */
function LandingPage({ onStart }: { onStart: () => void }) {
  const [ready, setReady] = useState(false);
  useEffect(() => { const t = setTimeout(() => setReady(true), 60); return () => clearTimeout(t); }, []);

  return (
    <div className="relative min-h-screen overflow-hidden flex items-center justify-center"
      style={{ background: "radial-gradient(ellipse 100% 80% at 50% -10%, #1a0a3c 0%, #0a0612 55%, #000 100%)" }}>

      {/* noise grain */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage:"url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E\")",
                 backgroundSize:"200px 200px", animation:"grain 8s steps(10) infinite" }} />

      {/* ambient orbs */}
      <div className="pointer-events-none absolute"
        style={{ width:600, height:600, borderRadius:"50%", top:"-15%", left:"-10%",
                 background:"radial-gradient(circle, rgba(120,40,220,.18) 0%, transparent 70%)",
                 animation:"float-slow 14s ease-in-out infinite" }} />
      <div className="pointer-events-none absolute"
        style={{ width:500, height:500, borderRadius:"50%", bottom:"-10%", right:"-8%",
                 background:"radial-gradient(circle, rgba(60,100,255,.15) 0%, transparent 70%)",
                 animation:"float-med 18s ease-in-out infinite" }} />
      <div className="pointer-events-none absolute"
        style={{ width:300, height:300, borderRadius:"50%", top:"30%", right:"15%",
                 background:"radial-gradient(circle, rgba(200,80,255,.1) 0%, transparent 70%)",
                 animation:"float-fast 10s ease-in-out infinite" }} />

      {/* grid lines */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{ backgroundImage:"linear-gradient(rgba(255,255,255,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.5) 1px,transparent 1px)",
                 backgroundSize:"80px 80px" }} />

      {/* content */}
      <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">

        {/* badge */}
        <div style={{ opacity: ready ? 1 : 0, animation: ready ? "fade-up .7s ease both" : "none", animationDelay:".1s" }}>
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase mb-8"
            style={{ border:"1px solid rgba(180,100,255,.35)", background:"rgba(120,40,220,.12)", color:"#c084fc", letterSpacing:"0.12em" }}>
            <span style={{ width:6, height:6, borderRadius:"50%", background:"#a855f7", display:"inline-block",
                           boxShadow:"0 0 8px #a855f7", animation:"pulse-ring 1.8s ease-out infinite" }} />
            eTaps Onboarding
          </span>
        </div>

        {/* headline */}
        <div style={{ opacity: ready ? 1 : 0, animation: ready ? "fade-up .8s ease both" : "none", animationDelay:".25s" }}>
          <h1 className="font-black leading-none mb-6"
            style={{ fontSize:"clamp(2.4rem,7vw,5rem)", letterSpacing:"-0.03em" }}>
            <span className="block text-white">Your Next Chapter</span>
            <span className="block" style={{
              background:"linear-gradient(135deg,#c084fc 0%,#818cf8 40%,#38bdf8 100%)",
              WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>
              Starts Here.
            </span>
          </h1>
        </div>

        {/* subheadline */}
        <div style={{ opacity: ready ? 1 : 0, animation: ready ? "fade-up .8s ease both" : "none", animationDelay:".4s" }}>
          <p className="text-lg font-medium mb-3" style={{ color:"rgba(255,255,255,.85)" }}>
            Imagine running your entire eCommerce business from one powerful dashboard.
          </p>
        </div>

        {/* bullets */}
        <div style={{ opacity: ready ? 1 : 0, animation: ready ? "fade-up .8s ease both" : "none", animationDelay:".55s" }}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10 mt-5">
            {["No more switching between multiple tools", "No more manual work", "No more operational headaches"].map((t, i) => (
              <div key={i} className="flex items-center gap-2 text-sm"
                style={{ color:"rgba(255,255,255,.5)" }}>
                <span style={{ width:5, height:5, borderRadius:"50%", background:"#7c3aed", display:"inline-block", flexShrink:0 }} />
                {t}
              </div>
            ))}
          </div>
        </div>

        {/* descriptor */}
        <div style={{ opacity: ready ? 1 : 0, animation: ready ? "fade-up .8s ease both" : "none", animationDelay:".65s" }}>
          <p className="text-base mb-12 leading-relaxed mx-auto max-w-xl"
            style={{ color:"rgba(255,255,255,.45)" }}>
            Just one platform built to streamline your operations, boost productivity,
            and help you scale with confidence. Let's build your workspace and bring
            your business to the next level.
          </p>
        </div>

        {/* CTA button */}
        <div style={{ opacity: ready ? 1 : 0, animation: ready ? "fade-up .8s ease both" : "none", animationDelay:".8s" }}>
          <div className="relative inline-block">
            {/* glow ring */}
            <div className="absolute inset-0 rounded-full opacity-60 blur-lg"
              style={{ background:"linear-gradient(135deg,#9333ea,#6366f1)", transform:"scale(1.15)" }} />
            <button onClick={onStart}
              className="relative group font-bold text-white rounded-full px-10 py-4 text-base overflow-hidden transition-transform duration-200 hover:scale-105 active:scale-95"
              style={{
                background:"linear-gradient(135deg,#9333ea 0%,#6366f1 50%,#38bdf8 100%)",
                backgroundSize:"200% auto",
                boxShadow:"0 0 30px rgba(147,51,234,.5), 0 0 60px rgba(99,102,241,.25), inset 0 1px 0 rgba(255,255,255,.15)",
                animation:"shimmer 3s linear infinite",
              }}>
              <span className="relative z-10 flex items-center gap-2.5">
                Build My Workspace
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </span>
            </button>
          </div>
          <p className="mt-5 text-xs" style={{ color:"rgba(255,255,255,.25)" }}>
            Takes less than 10 minutes · Completely free to set up
          </p>
        </div>
      </div>

      {/* bottom gradient fade */}
      <div className="pointer-events-none absolute bottom-0 inset-x-0 h-32"
        style={{ background:"linear-gradient(to top, rgba(0,0,0,.6), transparent)" }} />
    </div>
  );
}

/* ─── SUCCESS PAGE ─── */
const STEPS = [
  { icon:"📋", label:"Your onboarding details will be reviewed" },
  { icon:"👤", label:"A dedicated implementation specialist will be assigned" },
  { icon:"⚙️",  label:"Your eTaps workspace will be configured and tested" },
  { icon:"📞", label:"We'll reach out to schedule your onboarding session" },
  { icon:"🚀", label:"You're ready to go live!" },
];

function SuccessPage({ portalUrl }: { portalUrl: string | null }) {
  const [phase, setPhase] = useState(0); // 0=check 1=text 2=steps

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 700);
    const t2 = setTimeout(() => setPhase(2), 1200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden flex items-center justify-center py-16 px-6"
      style={{ background:"radial-gradient(ellipse 90% 70% at 50% 0%, #0a1628 0%, #050a14 60%, #000 100%)" }}>

      {/* orbs */}
      <div className="pointer-events-none absolute" style={{ width:500, height:500, borderRadius:"50%", top:"-20%", left:"-15%",
        background:"radial-gradient(circle, rgba(16,185,129,.12) 0%, transparent 70%)", animation:"float-slow 16s ease-in-out infinite" }} />
      <div className="pointer-events-none absolute" style={{ width:400, height:400, borderRadius:"50%", bottom:"-10%", right:"-10%",
        background:"radial-gradient(circle, rgba(59,130,246,.1) 0%, transparent 70%)", animation:"float-med 20s ease-in-out infinite" }} />

      {/* grid */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage:"linear-gradient(rgba(255,255,255,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.5) 1px,transparent 1px)",
                 backgroundSize:"80px 80px" }} />

      <div className="relative z-10 w-full max-w-2xl mx-auto text-center">

        {/* checkmark */}
        <div className="flex justify-center mb-8" style={{ animation:"pop-in .5s cubic-bezier(.34,1.56,.64,1) both" }}>
          <div className="relative flex items-center justify-center" style={{ width:96, height:96 }}>
            {/* pulse rings */}
            {[1,2].map(i => (
              <div key={i} className="absolute inset-0 rounded-full"
                style={{ border:"2px solid rgba(16,185,129,.4)", animation:`pulse-ring 2s ease-out ${i * .6}s infinite` }} />
            ))}
            <div className="relative flex items-center justify-center rounded-full"
              style={{ width:80, height:80, background:"linear-gradient(135deg,#059669,#10b981)", boxShadow:"0 0 40px rgba(16,185,129,.4)" }}>
              <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                <path d="M8 18l7 8L28 10" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"
                  strokeDasharray="60" strokeDashoffset="0"
                  style={{ animation:"draw-check .5s ease .4s both", strokeDashoffset: 60 }} />
              </svg>
            </div>
          </div>
        </div>

        {/* headline */}
        <div style={{ opacity: phase >= 1 ? 1:0, animation: phase >= 1 ? "fade-up .6s ease both":undefined }}>
          <p className="text-sm font-semibold tracking-widest uppercase mb-3"
            style={{ color:"#34d399", letterSpacing:"0.14em" }}>
            You're In!
          </p>
          <h1 className="font-black leading-tight mb-4"
            style={{ fontSize:"clamp(1.8rem,5vw,3.2rem)", letterSpacing:"-0.02em" }}>
            <span className="block text-white">Your eTaps Journey Has</span>
            <span className="block" style={{
              background:"linear-gradient(135deg,#34d399 0%,#3b82f6 100%)",
              WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>
              Officially Begun.
            </span>
          </h1>
          <p className="text-base mb-2" style={{ color:"rgba(255,255,255,.6)" }}>
            Congratulations! Your onboarding has been submitted successfully.
          </p>
        </div>

        {/* stat card */}
        <div style={{ opacity: phase >= 1 ? 1:0, animation: phase >= 1 ? "fade-up .7s .2s ease both":undefined }}>
          <div className="inline-flex items-center gap-3 rounded-2xl px-6 py-3 my-6"
            style={{ background:"rgba(52,211,153,.08)", border:"1px solid rgba(52,211,153,.2)" }}>
            <span className="text-2xl">⚡</span>
            <p className="text-sm text-left" style={{ color:"rgba(255,255,255,.7)" }}>
              Your workspace has been added to our{" "}
              <span style={{ color:"#34d399", fontWeight:600 }}>priority implementation queue</span>
              , where our specialists are currently setting up workspaces for{" "}
              <span style={{ color:"white", fontWeight:700 }}>30+ growing brands</span>.
            </p>
          </div>
        </div>

        {/* timeline heading */}
        <div style={{ opacity: phase >= 1 ? 1:0, animation: phase >= 1 ? "fade-up .7s .3s ease both":undefined }}>
          <p className="text-sm mb-2" style={{ color:"rgba(255,255,255,.4)" }}>
            Over the next{" "}
            <span style={{ color:"white", fontWeight:600 }}>7 to 15 business days</span>
            , we'll configure your workspace, connect your stores and couriers, and prepare everything for a smooth launch.
          </p>
        </div>

        {/* what happens next */}
        {phase >= 2 && (
          <div className="mt-10 text-left"
            style={{ animation:"fade-up .6s ease both" }}>
            <p className="text-xs font-bold tracking-widest uppercase mb-5 text-center"
              style={{ color:"rgba(255,255,255,.3)", letterSpacing:"0.15em" }}>
              What Happens Next
            </p>
            <div className="space-y-3">
              {STEPS.map((step, i) => (
                <div key={i} className="flex items-start gap-4 rounded-xl px-5 py-4"
                  style={{
                    background:"rgba(255,255,255,.03)", border:"1px solid rgba(255,255,255,.07)",
                    animation:`step-slide .5s ${.1 + i * .1}s ease both`, opacity:0,
                    animationFillMode:"forwards",
                  }}>
                  {/* step number */}
                  <div className="flex-shrink-0 flex items-center justify-center rounded-full text-xs font-bold"
                    style={{ width:28, height:28, background:"linear-gradient(135deg,#059669,#3b82f6)",
                             color:"white", boxShadow:"0 0 12px rgba(52,211,153,.3)" }}>
                    {i + 1}
                  </div>
                  <div className="flex-1 flex items-center gap-3">
                    <span className="text-lg">{step.icon}</span>
                    <p className="text-sm" style={{ color:"rgba(255,255,255,.7)" }}>{step.label}</p>
                  </div>
                  {/* connector dot on last */}
                  {i === STEPS.length - 1 && (
                    <span style={{ color:"#34d399", fontSize:18 }}>✓</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* portal link */}
        {phase >= 2 && portalUrl && (
          <div className="mt-8" style={{ animation:"fade-up .7s .7s ease both", opacity:0, animationFillMode:"forwards" }}>
            <a href={portalUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-transform duration-200 hover:scale-105"
              style={{ background:"rgba(59,130,246,.15)", border:"1px solid rgba(59,130,246,.35)", color:"#93c5fd" }}>
              Track Your Onboarding Progress
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15,3 21,3 21,9"/><line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
            </a>
          </div>
        )}

        {/* closing */}
        {phase >= 2 && (
          <div className="mt-10 pt-8" style={{ borderTop:"1px solid rgba(255,255,255,.06)",
            animation:"fade-in 1s .8s ease both", opacity:0, animationFillMode:"forwards" }}>
            <p className="text-sm font-medium" style={{ color:"rgba(255,255,255,.35)" }}>
              Thank you for choosing eTaps.{" "}
              <span style={{ color:"rgba(255,255,255,.55)" }}>We can't wait to help power your growth.</span>
            </p>
            <p className="mt-2 text-xs" style={{ color:"rgba(255,255,255,.2)" }}>
              © eTaps — Powering Pakistan's eCommerce
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── MAIN COMPONENT ─── */
const OnboardingForm = () => {
  const { slug } = useParams<{ slug: string }>();
  const [screen, setScreen] = useState<"landing" | "form" | "success">("landing");
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [portalUrl, setPortalUrl] = useState<string | null>(null);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const companySlug = slug || "etaps";
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
      const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const response = await fetch(`${SUPABASE_URL}/functions/v1/submit-onboarding-form`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${ANON_KEY}`,
          apikey: ANON_KEY,
        },
        body: JSON.stringify({ form_data: formData, company_slug: companySlug }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Submission failed");

      setPortalUrl(result.portal_url);
      setScreen("success");
    } catch (err: any) {
      setSubmitError(err.message || "Submission failed. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <style>{STYLES}</style>

      {screen === "landing" && <LandingPage onStart={() => setScreen("form")} />}

      {screen === "form" && (
        <div className="relative min-h-screen flex items-center justify-center px-6 py-16"
          style={{ background:"radial-gradient(ellipse 100% 80% at 50% -10%, #1a0a3c 0%, #0a0612 55%, #000 100%)" }}>
          <div className="w-full max-w-lg" style={{ animation:"fade-up .6s ease both" }}>
            <button onClick={() => setScreen("landing")}
              className="mb-8 flex items-center gap-2 text-sm transition-opacity hover:opacity-60"
              style={{ color:"rgba(255,255,255,.4)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              Back
            </button>
            <h2 className="text-2xl font-black text-white mb-2" style={{ letterSpacing:"-0.02em" }}>
              Build My Workspace
            </h2>
            <p className="text-sm mb-8" style={{ color:"rgba(255,255,255,.4)" }}>
              Fill in your details below to get started.
            </p>

            {/* form fields rendered by Lovable go here */}
            <div className="space-y-4 rounded-2xl p-6"
              style={{ background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.08)" }}>
              <p className="text-center text-sm py-8" style={{ color:"rgba(255,255,255,.3)" }}>
                — Form fields configured in Lovable —
              </p>
            </div>

            {submitError && (
              <div className="mt-4 rounded-xl px-4 py-3 text-sm"
                style={{ background:"rgba(239,68,68,.1)", border:"1px solid rgba(239,68,68,.3)", color:"#fca5a5" }}>
                {submitError}
              </div>
            )}

            <button onClick={handleSubmit} disabled={isSubmitting}
              className="relative mt-6 w-full rounded-2xl py-4 font-bold text-white text-base transition-transform duration-200 hover:scale-[1.02] active:scale-[.98] disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
              style={{ background:"linear-gradient(135deg,#9333ea,#6366f1)", boxShadow:"0 0 30px rgba(147,51,234,.4)" }}>
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-3">
                  <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                  </svg>
                  Submitting…
                </span>
              ) : "Submit Onboarding →"}
            </button>
          </div>
        </div>
      )}

      {screen === "success" && <SuccessPage portalUrl={portalUrl} />}
    </>
  );
};

export default OnboardingForm;
