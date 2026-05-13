import { Link } from "react-router-dom";
import { Menu } from "lucide-react";
import { lazy, Suspense, useState } from "react";

// Lazy-load the radix Sheet (only mounts when the mobile menu opens).
// Saves ~15KB radix-dialog from the public landing critical path.
const MobileMenu = lazy(() => import("./UnifiedHeaderMobileMenu"));

const UnifiedHeader = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b">
      <div className="container mx-auto px-4 py-2 md:py-3">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center min-h-0 min-w-0">
            <picture>
              <source type="image/webp" srcSet="/ejad-labs-logo.webp" />
              <img
                src="/ejad-labs-logo.png"
                alt="Ejad Labs"
                width={482}
                height={186}
                loading="eager"
                className="h-12 md:h-16 w-auto"
              />
            </picture>
          </Link>

          {/* Desktop nav: pure CSS hover dropdowns — no radix NavigationMenu (~30KB) */}
          <nav className="hidden md:flex items-center gap-1 text-sm font-medium" aria-label="Primary">
            {/* Programs */}
            <div className="relative group">
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-md px-3 py-2 hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:outline-none transition-colors"
              >
                Programs
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                  <path d="M2 4l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <ul className="invisible opacity-0 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 transition-opacity absolute left-0 top-full pt-1 w-[280px] z-50">
                <li className="rounded-md border bg-popover text-popover-foreground shadow-lg p-1.5 grid gap-1">
                  <Link to="/silicon-valley" className="block rounded-md p-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground">
                    Silicon Valley Tech Exchange
                  </Link>
                  <Link to="/inc" className="block rounded-md p-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground">
                    USA Company Formation
                  </Link>
                  <Link to="/visa" className="block rounded-md p-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground">
                    US/EU Visa Desk
                  </Link>
                </li>
              </ul>
            </div>

            {/* Events */}
            <div className="relative group">
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-md px-3 py-2 hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:outline-none transition-colors"
              >
                Events
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                  <path d="M2 4l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <ul className="invisible opacity-0 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 transition-opacity absolute left-0 top-full pt-1 w-[280px] z-50">
                <li className="rounded-md border bg-popover text-popover-foreground shadow-lg p-1.5 grid gap-1">
                  <a href="https://www.futurefest.pk" target="_blank" rel="noopener noreferrer" className="block rounded-md p-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground">
                    Future Fest
                  </a>
                  <a href="https://www.paktechsummit.com" target="_blank" rel="noopener noreferrer" className="block rounded-md p-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground">
                    Pakistan Tech Summit
                  </a>
                </li>
              </ul>
            </div>

            <Link to="/legacy" className="rounded-md px-3 py-2 hover:bg-accent hover:text-accent-foreground transition-colors">
              Our Legacy
            </Link>
            <Link to="/contact" className="rounded-md px-3 py-2 hover:bg-accent hover:text-accent-foreground transition-colors">
              Contact Us
            </Link>
          </nav>

          {/* Mobile: button is plain HTML; Sheet only loads after click */}
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="md:hidden p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <Menu className="h-6 w-6" />
          </button>
          {mobileOpen && (
            <Suspense fallback={null}>
              <MobileMenu open={mobileOpen} onOpenChange={setMobileOpen} />
            </Suspense>
          )}
        </div>
      </div>
    </header>
  );
};

export default UnifiedHeader;
