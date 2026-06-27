// Changelog data — add new entries at the TOP of the list.
// Each release groups changes by date. Categories: "feature" | "improvement" | "fix"
//
// INSTRUCTIONS FOR CLAUDE: whenever you ship changes, prepend a new entry (or
// add items to today's entry if one already exists) before committing.

export type ChangeCategory = "feature" | "improvement" | "fix";

export interface ChangeItem {
  category: ChangeCategory;
  text: string;
}

export interface ChangelogEntry {
  date: string;       // ISO date string "YYYY-MM-DD"
  version?: string;   // optional label e.g. "v1.4"
  items: ChangeItem[];
}

export const changelog: ChangelogEntry[] = [
  {
    date: "2026-06-27",
    version: "v2.2.0",
    items: [
      { category: "feature", text: "Onboarding form at /onboarding/:slug — seller onboarding submissions are saved via a server-side function that bypasses client RLS, with password fields encrypted before storage and a portal link generated for tracking progress" },
    ],
  },
  {
    date: "2026-06-22",
    version: "v2.1.3",
    items: [
      { category: "fix", text: "Lead status changes now always persist — status updates go through a dedicated server function that bypasses the CAPI tracking trigger entirely, removing the last path by which a background tracking failure could silently undo a status change" },
    ],
  },
  {
    date: "2026-06-22",
    version: "v2.1.3",
    items: [
      { category: "fix", text: "Lead status changes now always persist — status updates go through a dedicated server function that bypasses the CAPI tracking trigger entirely, removing the last path by which a background tracking failure could silently undo a status change" },
    ],
  },
  {
    date: "2026-06-22",
    version: "v2.1.2",
    items: [
      { category: "fix", text: "Lead status changes now persist after page refresh — the Meta CAPI tracking trigger was silently rolling back every status update when it encountered an error, leaving the database unchanged while the UI showed success" },
      { category: "fix", text: "Kanban and pipeline views: moving a lead or deal to a new status now shows an error toast if the database rejects the write, instead of showing false success" },
      { category: "fix", text: "Lead drawer: changes to follow-up date and pain point now show an error if the save is rejected, instead of silently failing" },
      { category: "fix", text: "Contacts bulk status and owner reassignment now shows an error when the update fails, and only applies the change to rows that were actually updated" },
    ],
  },
  {
    date: "2026-06-21",
    version: "v2.1.1",
    items: [
      { category: "fix", text: "Team page: assigning a role (e.g. CSR) to a user now persists correctly after page refresh — was silently failing due to a constraint conflict on the roles table" },
      { category: "fix", text: "Incoming call ringtone now stops immediately when the call is answered, instead of continuing to ring" },
      { category: "fix", text: "Admin pages no longer show a blank screen after a deployment update — a reload prompt is shown instead" },
    ],
  },
  {
    date: "2026-05-05",
    version: "v2.1.0",
    items: [
      { category: "feature", text: "Square payment page live at /payment — accepts card payments securely; sales team can send pre-filled payment links with amount and description" },
      { category: "feature", text: "Assets module — track equipment, inventory, and company property with full event history (restock, issue, return, damage, repair, retire)" },
      { category: "feature", text: "Assets: log stock movements and condition changes per item, with assignee and date tracking" },
    ],
  },
  {
    date: "2026-05-02",
    version: "v2.0.5",
    items: [
      { category: "feature", text: "Sentry error monitoring added — crashes are now automatically reported with full stack traces and component context" },
    ],
  },
  {
    date: "2026-05-02",
    version: "v2.0.4",
    items: [
      { category: "improvement", text: "Tasks page: checking or unchecking a task now responds instantly — the UI updates immediately instead of waiting for the server" },
      { category: "improvement", text: "Deals board cards and columns are now memoized — dragging deals no longer causes unrelated cards to re-render" },
      { category: "improvement", text: "Meta Ads sync: paginated data fetch now has a safety cap to prevent runaway loops if the Meta API returns malformed pagination" },
      { category: "improvement", text: "Admin pages are now wrapped in an error boundary — a crash in one page shows a recoverable error instead of a blank white screen" },
      { category: "fix", text: "Background email, CAPI events, and Meta Ads sync functions now initialise their database connection once on startup instead of on every request, improving cold-start time" },
    ],
  },
  {
    date: "2026-05-02",
    version: "v2.0.3",
    items: [
      { category: "improvement", text: "Contacts search is now debounced — typing no longer fires a database query on every keystroke" },
      { category: "improvement", text: "Lead drawer tabs are now lazy — Activities, Tasks, and History only load from the database when you first click that tab, cutting drawer-open queries from 7 down to 2" },
      { category: "improvement", text: "Analytics: deals chart now respects the selected date range instead of loading all deals ever created" },
      { category: "improvement", text: "Analytics: lead summary counts (total, qualified, converted) are now memoized and no longer recomputed on every render" },
      { category: "improvement", text: "Finance: invoices and payroll runs now have a sensible fetch cap so the page stays fast as records accumulate" },
      { category: "improvement", text: "Finance: marking an invoice paid, approving payroll, or updating a bank balance now refreshes only the affected data instead of reloading all eight Finance tables" },
    ],
  },
  {
    date: "2026-05-02",
    version: "v2.0.2",
    items: [
      { category: "fix", text: "Removed hardcoded Supabase API key from Company Formation form — now uses the secure client SDK like all other forms" },
      { category: "improvement", text: "All three application forms (Silicon Valley, Company Formation, Visa) now use the shared Supabase client for edge function calls, eliminating raw fetch calls" },
      { category: "improvement", text: "CRM admin: narrowed database queries across LeadActivities, LeadCommunications, LeadTasks, LeadTags, LeadDetailDrawer, and WhatsApp chat to explicit column lists — reduces data transfer on every panel open" },
      { category: "improvement", text: "Tag assign and unassign in lead drawer now update instantly without a full database round-trip" },
      { category: "fix", text: "Fixed memory leak in WhatsApp call listener — processed call ID set is now cleared on every subscription rebuild" },
      { category: "improvement", text: "Removed unused icon import from appointment scheduler, shrinking that bundle slightly" },
    ],
  },
  {
    date: "2026-05-02",
    version: "v2.0.1",
    items: [
      { category: "improvement", text: "Removed unused icon imports from all three success pages to keep page bundles smaller" },
      { category: "fix", text: "Facebook pixel event now correctly de-duplicates on page reload by passing the event ID to the browser pixel on the success pages" },
      { category: "improvement", text: "Database queries in Contacts narrowed to explicit column lists, reducing data transfer from the server" },
      { category: "improvement", text: "Supabase client in the form-submission function is now created once per cold start instead of once per request" },
    ],
  },
  {
    date: "2026-05-02",
    version: "v2.0",
    items: [
      { category: "feature", text: "Analytics: Meta Ads tab — connects to Meta Marketing API to sync ad spend, impressions, clicks, and conversions from your ad account automatically" },
      { category: "feature", text: "Analytics: Meta Ads KPIs — Total Spend, Cost per Lead (from CRM leads with click IDs), Avg CPC, Avg CTR, and Meta-reported conversions all in one view" },
      { category: "feature", text: "Analytics: Meta Ads daily spend + clicks chart — dual-axis line chart over the last 30 days to spot trends at a glance" },
      { category: "feature", text: "Analytics: Campaign Performance table — per-campaign breakdown of spend, impressions, clicks, CPC, and CTR with color-coded performance indicators" },
      { category: "feature", text: "Analytics: Sync Now button to pull the latest Meta ad data on demand; shows last-synced timestamps for ads and insights" },
      { category: "feature", text: "Analytics: Meta access token and Pixel ID can be stored and updated directly in the UI without touching server configuration" },
      { category: "feature", text: "Analytics: Conversions API queue panel — shows pending, failed, dead-letter, and sent event counts with a Send Pending button to dispatch server-side conversion events to Meta" },
      { category: "feature", text: "Meta Conversions API: server-side events (Lead, CompleteRegistration, Purchase) are automatically queued when a lead's status changes and sent to Meta with hashed PII for improved attribution" },
      { category: "improvement", text: "Meta: each funnel now uses its own dedicated Pixel ID (Silicon Valley, Company Formation, Visa Desk) so conversions are correctly attributed to the right ad account" },
      { category: "fix", text: "Silicon Valley and Visa Desk success pages now fire a browser Pixel Lead event — previously only Company Formation was tracked" },
      { category: "improvement", text: "Meta conversion deduplication: a unique event ID is now generated at form submission and shared between the browser Pixel and the Conversions API so Meta does not double-count the same lead" },
    ],
  },
  {
    date: "2026-05-02",
    version: "v1.9",
    items: [
      { category: "feature", text: "Dashboard: Outreach Tracker replaces Today's Activity — progress bars for LinkedIn connections (50/day), cold emails (50/day), and follow-ups (20/day) with red/amber/green color coding" },
      { category: "feature", text: "Dashboard: Log Outreach button to set your daily totals; data is saved per-user per-day and persists across sessions" },
      { category: "feature", text: "Dashboard: late-day alert banner (after 5 PM) if outreach targets are not 80% complete" },
      { category: "feature", text: "Deals: Referral Flywheel — closing a deal as Won now prompts for referral asked, testimonial, and referral names; entering names auto-creates new leads with Source = Referral" },
      { category: "feature", text: "Analytics: Weekly Activity Leaderboard in the Pipeline tab — team members ranked by activities logged in the last 7 days; top performer highlighted green, lowest highlighted amber" },
      { category: "feature", text: "Analytics: Stuck Leads alert table — shows active leads with no activity in 5+ days, with owner and days-since-contact" },
    ],
  },
  {
    date: "2026-05-02",
    version: "v1.8",
    items: [
      { category: "feature", text: "Global WhatsApp calls toggle — admin can enable or disable all inbound and outbound calls from the WhatsApp settings page" },
      { category: "improvement", text: "WhatsApp call listener no longer reconnects on every call state change, reducing unnecessary network activity during active calls" },
      { category: "feature", text: "Dashboard: Needs Attention panel — surfaces leads with no activity in 48+ hours, overdue follow-ups, and leads missing a follow-up date" },
      { category: "feature", text: "Lead drawer: Next Follow-up Date field — highlighted amber when missing, saves automatically on blur" },
      { category: "feature", text: "Lead drawer: Pain Point field — highlighted amber when empty, required before marking a lead as Qualified" },
      { category: "feature", text: "Stage gate: moving a lead to Qualified is blocked if the Pain Point field is empty" },
      { category: "feature", text: "Inactivity gate: closing a lead as Not Interested / Unqualified / Irrelevant with fewer than 3 logged activities shows a confirmation prompt" },
      { category: "improvement", text: "Contacts table: each row now shows stale (⚠), overdue follow-up (⏰), and scheduled follow-up date inline" },
      { category: "improvement", text: "Activity logging now updates the lead's last-contacted timestamp automatically" },
    ],
  },
  {
    date: "2026-05-01",
    version: "v1.7",
    items: [
      { category: "feature", text: "Finance module: create and track invoices with line items, tax, and multi-currency (USD/PKR)" },
      { category: "feature", text: "Finance: Gmail button on invoices opens a pre-filled compose window and auto-marks draft as sent" },
      { category: "feature", text: "Finance: log income and expense transactions with COA categories, vendors, and bank accounts" },
      { category: "feature", text: "Finance: bank accounts dashboard (Slash, Brex, Wise, Capital One, Bank Alfalah) with CSV import for any bank and manual balance update" },
      { category: "feature", text: "Finance: HR & Payroll — employee records, salary/bonus/commission runs with CEO approval workflow" },
      { category: "feature", text: "Finance: commission rules engine — configure % per funnel, auto-calculates from closed deals" },
      { category: "feature", text: "Analytics module: funnel conversion bars, weekly lead volume chart, slow-response alert (leads stuck >24h)" },
      { category: "feature", text: "Analytics: revenue vs. expenses line chart by month, profit margin, funnel breakdown" },
      { category: "feature", text: "Analytics: rep performance table with conversion rates per team member" },
      { category: "feature", text: "Analytics: source attribution table showing lead quality and qualification rate per channel" },
      { category: "feature", text: "Deals: loss reason dialog when moving a deal to a lost stage (7 standard B2B reasons)" },
      { category: "feature", text: "Deals: refund logging — records refund amount/date/reason and auto-creates an expense transaction" },
    ],
  },
  {
    date: "2026-05-01",
    version: "v1.6",
    items: [
      { category: "feature", text: "Company Formation leads now always assigned to Ajwa in the appointment scheduler" },
      { category: "feature", text: "Ajwa added to all contact owner dropdowns (bulk assign and per-row) in Contacts" },
      { category: "improvement", text: "DB migration: existing Company Formation leads backfilled with Ajwa as contact owner" },
      { category: "improvement", text: "Leads page: replaced select(*) with explicit columns — significantly faster list load" },
      { category: "improvement", text: "Leads page: 300ms debounce on search input to reduce unnecessary DB queries" },
      { category: "improvement", text: "Appointments page: narrowed all queries (main list + linked lead + contact history)" },
      { category: "improvement", text: "Applications page: narrowed queries + debounced search" },
      { category: "improvement", text: "Calendar page: narrowed all appointment and lead queries" },
    ],
  },
  {
    date: "2026-04-30",
    version: "v1.5",
    items: [
      { category: "feature", text: "@mention support in activity notes, tasks, and lead notes — type @ to tag a teammate" },
      { category: "feature", text: "Email templates: saved templates available when logging an email activity" },
      { category: "feature", text: "Lead scoring: every lead gets a 0–100 score based on status, profile completeness, attribution, and recency" },
      { category: "feature", text: "WhatsApp conversation list virtualised — smooth scrolling with 60+ conversations" },
      { category: "feature", text: "Contacts: saved filter views — bookmark any combination of filters and reload with one click" },
      { category: "feature", text: "Lead → Deal conversion button in lead detail drawer pre-fills deal title and funnel" },
      { category: "feature", text: "Deals pipeline: drag-and-drop cards between stages with optimistic updates" },
    ],
  },
  {
    date: "2026-04-29",
    version: "v1.4",
    items: [
      { category: "feature", text: "Tasks can now be associated with a lead — search and link from the global Tasks page" },
      { category: "feature", text: "Lead drawer: tasks tab now supports inline editing of existing tasks" },
      { category: "improvement", text: "Task list shows linked lead name as a dismissible badge" },
    ],
  },
  {
    date: "2026-04-28",
    version: "v1.3",
    items: [
      { category: "feature", text: "WhatsApp CRM panel — real-time conversation list with search and message threading" },
      { category: "feature", text: "Applications pipeline view — Kanban board per funnel with drag-and-drop stage changes" },
      { category: "feature", text: "Calendar view — grouped appointment list with edit/reschedule/cancel actions" },
      { category: "improvement", text: "Lead detail drawer: tabbed layout with Activities, Tasks, Notes, Appointments, and Deals" },
    ],
  },
  {
    date: "2026-04-27",
    version: "v1.2",
    items: [
      { category: "feature", text: "Contacts page: bulk status and owner assignment for selected leads" },
      { category: "feature", text: "Contacts: advanced filters (funnel, status, owner, relevancy) with pagination" },
      { category: "improvement", text: "Lead activities log: call, meeting, email, WhatsApp, note — with duration and outcome" },
      { category: "fix", text: "Fixed blank screen on stale chunk hash after deployments" },
    ],
  },
  {
    date: "2026-04-26",
    version: "v1.1",
    items: [
      { category: "feature", text: "Admin portal launched at /admin — Dashboard, Contacts, Tasks, Deals, Applications, Appointments, Team" },
      { category: "feature", text: "Role-based access: admin and CSR roles with separate permissions" },
      { category: "feature", text: "Appointment scheduler on public funnels (Silicon Valley, Company Formation, Visa Desk)" },
      { category: "feature", text: "Lead capture forms with full UTM / click-ID attribution tracking" },
    ],
  },
];
