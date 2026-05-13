---
name: Fathom + GSuite lead history sync
description: Architecture of the unified lead communications timeline (Fathom recordings, Gmail, Google Calendar, Google Drive)
type: feature
---
The CRM aggregates all touchpoints with a lead into a single `lead_communications` table (source: 'fathom' | 'gmail' | 'gcal' | 'gdrive' | 'manual'). Rendered in the LeadDetailDrawer "History" tab via `LeadCommunications.tsx`.

Fathom: webhook at `/functions/v1/fathom-webhook` (HMAC-SHA256 with `FATHOM_WEBHOOK_SECRET`; hex or `sha256=` prefix). Matches by appointment date + email first, falls back to lead email. Stores recording, summary, transcript, and each action item as separate rows. Audit trail in `fathom_webhook_log`.

GSuite: edge function `/functions/v1/gsuite-sync` runs every 15 minutes via pg_cron (`gsuite-sync-every-15-min`). Uses domain-wide delegation on the existing `GOOGLE_SERVICE_ACCOUNT` to impersonate every `@ejadlabs.com` user. Required DWD scopes: `gmail.readonly`, `calendar.readonly`, `drive.metadata.readonly`. Per-user incremental cursors live in `gsuite_sync_state`.

Trigger `link_communication_to_lead` auto-resolves `lead_id` from `appointment_id` or `participants[].email` on insert.
