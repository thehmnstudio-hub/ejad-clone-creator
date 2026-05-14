create table if not exists public.lead_pipeline_configs (
  id bigint primary key,
  configs jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.lead_pipeline_configs (id, configs)
values (
  1,
  '[{"leadType":"Silicon Valley","stages":[{"name":"New","statuses":["new","Open"]},{"name":"Contacted","statuses":["contacted","Connected","ATC","Failed to Contact"]},{"name":"Qualified","statuses":["qualified","Qualified","Unqualified"]},{"name":"Closed","statuses":["converted","Not interested","Irrelevant","lost"]}]}]'::jsonb
)
on conflict (id) do nothing;
