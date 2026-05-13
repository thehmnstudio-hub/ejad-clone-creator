# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Project Is

Ejad Labs HQ is a dual-purpose application:

1. **Public marketing site** — landing pages for lead capture funnels (Silicon Valley, INC/company formation, Visa, etc.). Each page has a form that submits to a Supabase Edge Function, which writes a lead row and fires tracking events.
2. **Internal CRM admin portal** (`/admin`) — for the sales team to manage leads, tasks, deals, activities, WhatsApp conversations, and appointments.

## Commands

```bash
npm run dev          # Start dev server on port 8080
npm run build        # Production build
npm run lint         # ESLint
```

No test suite exists. There is no test command.

## Tech Stack

- **Frontend**: React 18 + TypeScript, Vite, Tailwind CSS, shadcn/ui (Radix primitives)
- **Backend**: Supabase (Postgres + Auth + Storage + Edge Functions written in Deno/TypeScript)
- **Routing**: react-router-dom v6
- **State/data fetching**: TanStack Query (config in `src/App.tsx`); direct Supabase client calls for most CRM reads/writes
- **Icons**: lucide-react
- **Forms**: react-hook-form + zod (public forms); controlled state for admin forms

## Folder Structure

```
src/
  pages/
    *.tsx              # Public landing pages (Index, USA, INC, Visa, …)
    admin/             # CRM admin pages (Dashboard, Contacts/Leads, Tasks, Deals, …)
  components/
    admin/             # Admin-only components (LeadDetailDrawer, LeadTasks, LeadActivities, …)
    ui/                # shadcn/ui primitives — do not edit directly
    *.tsx              # Public site components (Header, Footer, Hero, FacebookPixel, …)
  hooks/
    useCurrentUser.ts  # Auth + role check (isAdmin, isCsr)
    use-tracking.ts    # UTM + click ID capture for form submissions
  integrations/
    supabase/
      client.ts        # Singleton Supabase client (VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY)
      types.ts         # Auto-generated DB types — regenerate via Supabase CLI, do not hand-edit
  utils/
    leadClassification.ts  # Whitelist/blacklist logic that auto-qualifies leads
  lib/utils.ts         # cn() helper + formatFriendlyDate()

supabase/
  config.toml          # Project ID + per-function JWT settings
  migrations/          # Chronological SQL migrations (never edit old files)
  functions/           # Deno Edge Functions (one folder per function)
```

## Key Conventions

### Supabase access pattern
Import `supabase` from `@/integrations/supabase/client` and call it directly in components or hooks. TanStack Query is available but most admin pages use plain `useState` + `useEffect` with direct Supabase calls. Both patterns coexist — match whichever the file already uses.

### Auth & roles
`useCurrentUser()` returns `{ user, loading }` where `user.isAdmin` and `user.isCsr` reflect rows in the `user_roles` table. The admin layout (`AdminLayout.tsx`) blocks access entirely unless the user has `admin` or `csr` role. Role checks elsewhere rely on `useCurrentUser`.

### `@/` path alias
`@/` maps to `src/`. Always use this alias for imports inside `src/`.

### shadcn/ui components
All UI primitives live in `src/components/ui/`. Add new ones via the shadcn CLI (`npx shadcn-ui@latest add <component>`), never by hand-writing into that folder.

### Database migrations
New schema changes go in a new timestamped `.sql` file under `supabase/migrations/`. Every table must have RLS enabled. Use the existing `has_role(auth.uid(), 'admin'::app_role)` helper for policies — see any migration for the pattern.

### Lead–task relationship
`lead_tasks.lead_id` is a nullable FK to `leads.id`. Tasks can exist without a lead. The global Tasks page (`src/pages/admin/Tasks.tsx`) lets you search leads to associate at creation. The `LeadDetailDrawer` embeds `LeadTasks` in its Tasks tab, auto-scoped to that lead.

### Lead funnels
Leads belong to one of three funnels: `'Silicon Valley'`, `'Visa Desk'`, `'Company Formation'`. The funnel is set at form-submission time and drives filtering throughout the CRM.

### Edge Functions
Deno TypeScript. CORS preflight (`OPTIONS`) must be handled in every function. Public-facing functions (form submissions, webhooks) have `verify_jwt = false` in `config.toml`. Internal ones require a valid JWT.

### Tracking / attribution
`UTMCapture` (mounted in `App.tsx`) writes UTM params to `localStorage`/`sessionStorage` on every page load. `useTracking()` assembles the full attribution payload (UTM + click IDs from all major ad platforms + Facebook cookies) for inclusion in form submissions.

### Build chunking
`vite.config.ts` manually chunks heavy deps (`recharts`, `@supabase/supabase-js`, Radix, etc.) to keep public landing page bundles small. Admin-only deps go in the `admin-vendor` chunk so they're never preloaded on public routes. Keep this in mind if adding new large dependencies.

### Changelog — REQUIRED for every commit
The changelog lives at `src/data/changelog.ts`. **Every time you ship changes, you must prepend a new entry (or add items to today's entry if one already exists) before committing.** The format is:

```ts
{
  date: "YYYY-MM-DD",   // today's date
  version: "vX.Y",      // bump the minor version for features, patch for fixes
  items: [
    { category: "feature",     text: "One-line user-facing description" },
    { category: "improvement", text: "..." },
    { category: "fix",         text: "..." },
  ],
}
```

Rules:
- New entries go at the **top** of the `changelog` array.
- `category` must be `"feature"`, `"improvement"`, or `"fix"` — nothing else.
- Text should be written for a non-technical user (no variable names, no SQL).
- Never edit past entries — only prepend.

## Performance & Lean Code Rules

These rules are non-negotiable. Every change Claude ships must follow them.

**No redundant DB queries**
If data is already loaded by a React hook or context, read from there — do not fire a second Supabase query for the same row from a sibling component. One fetch per concern per mount.

**Stable Supabase Realtime subscriptions**
- Keep `useEffect` dependency arrays minimal. Only list values whose change should genuinely tear down and rebuild the channel.
- Use `useRef` to shadow state values that are read inside subscription handlers. A ref update never triggers re-subscription; a state value in the dep array does.
- Never put state-machine values (e.g. `callState`, `sessionStatus`) in the dep array of a channel subscription — every state transition would tear down and recreate the channel.

**One subscription per concern**
Do not open duplicate channels to the same Supabase table or broadcast channel from sibling components. Share subscription state via context or a single shared hook instance rather than subscribing independently in multiple places.

**Narrow Supabase selects**
Use `select("col1, col2")` instead of `select("*")` unless every column is genuinely needed. This reduces payload size and avoids over-fetching.

**Stable callbacks in hooks**
Wrap all functions returned from hooks in `useCallback` with correct, minimal dependency arrays. Unstable references propagate and cause downstream `useEffect` re-runs.

**Always clean up subscriptions**
Every `supabase.channel(...).subscribe()` must have a corresponding `supabase.removeChannel(ch)` in the `useEffect` cleanup return. Leaking channels wastes Supabase connections and can cause duplicate event delivery.

**No speculative abstractions**
Do not add helpers, wrappers, or generics for hypothetical future use. Implement exactly what the task requires — nothing more.
