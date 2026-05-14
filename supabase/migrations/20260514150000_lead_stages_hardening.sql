-- Subtask J-1.1/J-1.3: strengthen lead_stages schema and validations
alter table public.lead_stages
  add column if not exists created_by uuid references public.users(id),
  add column if not exists entry_condition text,
  add column if not exists exit_trigger text;

-- Backfill singular column from legacy pluralized column if present
update public.lead_stages
set entry_condition = coalesce(entry_condition, entry_conditions)
where entry_condition is null;

alter table public.lead_stages
  alter column name type varchar,
  alter column color type varchar,
  alter column position set not null;

alter table public.lead_stages
  add constraint lead_stages_lead_type_position_unique unique (lead_type_id, position);

alter table public.lead_stages
  add constraint lead_stages_entry_condition_chk
  check (
    entry_condition is null
    or entry_condition in ('manual','calendly_booked','imported','form_submitted','api_created')
  );

alter table public.lead_stages
  add constraint lead_stages_exit_trigger_chk
  check (
    exit_trigger is null
    or exit_trigger in ('proposal_sent','demo_done','contract_signed','payment_received','manual')
  );
