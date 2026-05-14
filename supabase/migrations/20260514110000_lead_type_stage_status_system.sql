-- Lead type + stage + status configuration system
create table if not exists public.lead_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  default_team text,
  default_currency text not null default 'USD',
  default_status_id uuid,
  manual_review_before_outreach boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lead_statuses (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  color text not null default '#64748b',
  description text,
  locks_stage_movement boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.lead_types
  add constraint lead_types_default_status_fk
  foreign key (default_status_id) references public.lead_statuses(id) on delete set null;

create table if not exists public.lead_stages (
  id uuid primary key default gen_random_uuid(),
  lead_type_id uuid not null references public.lead_types(id) on delete cascade,
  name text not null,
  description text,
  color text not null default '#3b82f6',
  position integer not null,
  entry_conditions text,
  exit_trigger text,
  sla_hours integer,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(lead_type_id, name)
);

create index if not exists idx_lead_stages_type_position on public.lead_stages(lead_type_id, position);

create table if not exists public.lead_source_activities (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  source text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.leads
  add column if not exists lead_type_id uuid references public.lead_types(id) on delete set null,
  add column if not exists lead_stage_id uuid references public.lead_stages(id) on delete set null,
  add column if not exists lead_status_id uuid references public.lead_statuses(id) on delete set null,
  add column if not exists source text,
  add column if not exists utm_ad_set text,
  add column if not exists utm_ad_name text,
  add column if not exists duplicate_of_lead_id uuid references public.leads(id) on delete set null,
  add column if not exists duplicate_needs_review boolean not null default false,
  add column if not exists stage_entered_at timestamptz;

insert into public.lead_statuses (name, color, description, locks_stage_movement)
values
('Active', '#2563eb', 'Default working status', false),
('Unresponsive', '#f59e0b', 'No reply after follow ups', false),
('Junk / Spam', '#ef4444', 'Invalid or spam lead', true),
('Duplicate', '#a855f7', 'Potential duplicate awaiting resolution', true),
('Disqualified', '#6b7280', 'Lead is disqualified', true),
('On Hold', '#0ea5e9', 'Temporarily paused', false),
('Converted', '#16a34a', 'Handed to onboarding', true)
on conflict (name) do nothing;

insert into public.lead_types (name, description, default_team, default_currency, manual_review_before_outreach, default_status_id)
select 'ETAPS Pakistan', 'Pakistan pipeline', 'ETAPS Team', 'PKR', false, s.id from public.lead_statuses s where s.name='Active'
on conflict (name) do nothing;

insert into public.lead_types (name, description, default_team, default_currency, manual_review_before_outreach, default_status_id)
select 'Silicon Valley', 'Silicon Valley pipeline', 'SV Team', 'USD', false, s.id from public.lead_statuses s where s.name='Active'
on conflict (name) do nothing;

insert into public.lead_types (name, description, default_team, default_currency, manual_review_before_outreach, default_status_id)
select 'Enterprise', 'Enterprise accounts', 'Enterprise Team', 'USD', true, s.id from public.lead_statuses s where s.name='Active'
on conflict (name) do nothing;

insert into public.lead_types (name, description, default_team, default_currency, manual_review_before_outreach, default_status_id)
select 'SME / Startup', 'SME and startup leads', 'SME Team', 'USD', false, s.id from public.lead_statuses s where s.name='Active'
on conflict (name) do nothing;

with etaps as (select id from public.lead_types where name='ETAPS Pakistan')
insert into public.lead_stages (lead_type_id, name, position, color)
select etaps.id, v.name, v.pos, '#3b82f6'
from etaps,
(values
('New Lead',1),('WhatsApp Sent',2),('Attempted Contact',3),('Demo Scheduled',4),('Demo Done',5),('Proposal Sent',6),('Negotiating',7),('Closed Won',8),('Closed Won – Trial',9),('Trial Active',10),('Trial Expired',11),('Disqualified / Lost',12)
) v(name,pos)
on conflict (lead_type_id, name) do nothing;

with sv as (select id from public.lead_types where name='Silicon Valley')
insert into public.lead_stages (lead_type_id, name, position, color)
select sv.id, v.name, v.pos, '#0ea5e9'
from sv,
(values
('New Lead',1),('Outreach Sent',2),('Discovery Call Scheduled',3),('Discovery Done',4),('Demo Scheduled',5),('Demo Done',6),('POC / Pilot',7),('Proposal Sent',8),('Legal / Procurement',9),('Closed Won',10),('Lost',11)
) v(name,pos)
on conflict (lead_type_id, name) do nothing;
