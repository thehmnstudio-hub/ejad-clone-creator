import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    modulePreload: {
      polyfill: true,
      // Block heavy / non-critical chunks from being preloaded as <link rel="modulepreload">
      // in the entry HTML. They still load lazily via React.lazy() + Suspense.
      resolveDependencies: (_filename, deps) => {
        const blocked = [
          "admin-vendor", "recharts", "supabase", "lucide", "date-fns", "carousel-vendor",
        ];
        return deps.filter((dep) => !blocked.some((b) => dep.includes(b)));
      },
    },
    rollupOptions: {
      output: {
        // Bundle related vendors together to flatten the request waterfall on
        // mobile. Previously each radix primitive shipped as its own <2KB
        // chunk, causing a 10+ deep modulepreload chain.
        manualChunks: (id) => {
          if (!id.includes("node_modules")) return;

          if (id.includes("@sentry/")) return "sentry";

          // Core React runtime
          if (
            id.includes("/react/") ||
            id.includes("/react-dom/") ||
            id.includes("/scheduler/") ||
            id.includes("react/jsx-runtime") ||
            id.includes("react/jsx-dev-runtime")
          ) return "react";

          if (id.includes("react-router")) return "react-router";
          if (id.includes("date-fns")) return "date-fns";
          if (id.includes("lucide-react")) return "lucide";

          // Recharts is huge (~400KB) and used ONLY by Analytics page.
          // Keep it in its own chunk so Dashboard / Contacts / Tasks / Deals don't pay for it.
          if (id.includes("recharts") || id.includes("d3-")) return "recharts";

          // Supabase JS is needed by every admin page → its own chunk, cached across navigations.
          if (id.includes("@supabase/supabase-js") || id.includes("@lovable.dev")) return "admin-vendor";

          // Embla carousel + plugins → single chunk (was 3 separate files)
          if (id.includes("embla-carousel")) return "carousel-vendor";

          // All small radix primitives + form/utility libs → one ui-vendor chunk.
          // Flattens the radix waterfall and avoids dozens of <2KB requests.
          if (
            id.includes("@radix-ui/") ||
            id.includes("class-variance-authority") ||
            id.includes("clsx") ||
            id.includes("tailwind-merge") ||
            id.includes("react-hook-form") ||
            id.includes("@hookform/resolvers") ||
            id.includes("zod") ||
            id.includes("cmdk") ||
            id.includes("vaul") ||
            id.includes("sonner") ||
            id.includes("input-otp") ||
            id.includes("next-themes") ||
            id.includes("react-day-picker") ||
            id.includes("react-resizable-panels")
          ) return "ui-vendor";
        },
      },
    },
  },
}));
