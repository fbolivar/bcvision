-- ============================================================
-- FirewallIQ — Schema inicial multi-tenant
-- Aplicar en Supabase Dashboard > SQL Editor
-- ============================================================

-- Extensiones necesarias
create extension if not exists "uuid-ossp";
create extension if not exists "pg_net";

-- ============================================================
-- ORGANIZATIONS
-- ============================================================
create table public.organizations (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  slug        text unique not null,
  plan        text not null default 'free' check (plan in ('free','professional','enterprise')),
  max_devices integer not null default 3,
  retention_days integer not null default 30,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.organizations enable row level security;

-- ============================================================
-- USERS (extiende auth.users)
-- ============================================================
create table public.users (
  id          uuid primary key references auth.users(id) on delete cascade,
  org_id      uuid references public.organizations(id) on delete cascade,
  full_name   text,
  role        text not null default 'viewer' check (role in ('admin','analyst','viewer')),
  email       text not null,
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.users enable row level security;

-- ============================================================
-- DEVICES (firewalls registrados)
-- ============================================================
create table public.devices (
  id          uuid primary key default uuid_generate_v4(),
  org_id      uuid not null references public.organizations(id) on delete cascade,
  name        text not null,
  ip_address  inet not null,
  brand       text not null check (brand in ('fortinet','cisco','pfsense','sophos','paloalto','mikrotik','generic')),
  model       text,
  location    text,
  active      boolean not null default true,
  last_seen   timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique(org_id, ip_address)
);

alter table public.devices enable row level security;
create index idx_devices_org_id on public.devices(org_id);
create index idx_devices_ip on public.devices(ip_address);

-- ============================================================
-- SYSLOG_RAW (mensajes crudos sin parsear)
-- ============================================================
create table public.syslog_raw (
  id          bigserial primary key,
  org_id      uuid not null references public.organizations(id) on delete cascade,
  device_id   uuid references public.devices(id) on delete set null,
  received_at timestamptz not null default now(),
  raw_message text not null,
  source_ip   inet not null,
  facility    smallint,
  severity    smallint,
  created_at  timestamptz not null default now()
);

alter table public.syslog_raw enable row level security;
create index idx_syslog_raw_org_received on public.syslog_raw(org_id, received_at desc);
create index idx_syslog_raw_device on public.syslog_raw(device_id);

-- Partición por tiempo: retención automática vía pg_partman (opcional en planes enterprise)
-- Por ahora limpieza manual con función de cron

-- ============================================================
-- FIREWALL_EVENTS (eventos parseados y normalizados)
-- ============================================================
create table public.firewall_events (
  id              bigserial primary key,
  org_id          uuid not null references public.organizations(id) on delete cascade,
  device_id       uuid references public.devices(id) on delete set null,
  raw_id          bigint references public.syslog_raw(id) on delete set null,
  event_time      timestamptz not null default now(),
  event_type      text not null check (event_type in ('traffic','block','auth','threat','system','vpn','nat')),
  action          text check (action in ('allow','deny','drop','reset','monitor','redirect')),
  protocol        text,
  src_ip          inet,
  dst_ip          inet,
  src_port        integer,
  dst_port        integer,
  src_country     text,
  dst_country     text,
  bytes_sent      bigint default 0,
  bytes_received  bigint default 0,
  duration_ms     integer,
  user_name       text,
  url             text,
  application     text,
  threat_name     text,
  threat_category text,
  severity        text not null default 'info' check (severity in ('critical','high','medium','low','info')),
  parsed_data     jsonb,
  created_at      timestamptz not null default now()
);

alter table public.firewall_events enable row level security;
create index idx_fe_org_time on public.firewall_events(org_id, event_time desc);
create index idx_fe_device on public.firewall_events(device_id);
create index idx_fe_severity on public.firewall_events(org_id, severity);
create index idx_fe_src_ip on public.firewall_events(org_id, src_ip);
create index idx_fe_event_type on public.firewall_events(org_id, event_type);
create index idx_fe_threat on public.firewall_events(org_id, threat_name) where threat_name is not null;

-- ============================================================
-- ALERTS (incidentes de seguridad)
-- ============================================================
create table public.alerts (
  id          uuid primary key default uuid_generate_v4(),
  org_id      uuid not null references public.organizations(id) on delete cascade,
  event_id    bigint references public.firewall_events(id) on delete set null,
  device_id   uuid references public.devices(id) on delete set null,
  type        text not null,
  title       text not null,
  description text,
  severity    text not null check (severity in ('critical','high','medium','low','info')),
  status      text not null default 'open' check (status in ('open','acknowledged','resolved','false_positive')),
  assigned_to uuid references public.users(id) on delete set null,
  notes       text,
  created_at  timestamptz not null default now(),
  acknowledged_at timestamptz,
  resolved_at timestamptz,
  updated_at  timestamptz not null default now()
);

alter table public.alerts enable row level security;
create index idx_alerts_org_status on public.alerts(org_id, status);
create index idx_alerts_org_severity on public.alerts(org_id, severity);
create index idx_alerts_created on public.alerts(org_id, created_at desc);

-- ============================================================
-- REPORTS (reportes generados)
-- ============================================================
create table public.reports (
  id           uuid primary key default uuid_generate_v4(),
  org_id       uuid not null references public.organizations(id) on delete cascade,
  created_by   uuid references public.users(id) on delete set null,
  type         text not null check (type in ('executive','technical','compliance','custom')),
  title        text not null,
  period_start date not null,
  period_end   date not null,
  generated_at timestamptz not null default now(),
  content_json jsonb,
  pdf_url      text,
  sent_to      jsonb default '[]',
  status       text not null default 'generating' check (status in ('generating','ready','failed','sent')),
  created_at   timestamptz not null default now()
);

alter table public.reports enable row level security;
create index idx_reports_org on public.reports(org_id, created_at desc);

-- ============================================================
-- THREAT_FEEDS (IPs/dominios maliciosos conocidos)
-- ============================================================
create table public.threat_feeds (
  id          uuid primary key default uuid_generate_v4(),
  indicator   text not null,
  type        text not null check (type in ('ip','domain','url','hash')),
  category    text,
  severity    text not null default 'high' check (severity in ('critical','high','medium','low')),
  source      text,
  active      boolean not null default true,
  expires_at  timestamptz,
  created_at  timestamptz not null default now()
);

create unique index idx_threat_feeds_indicator on public.threat_feeds(indicator, type);
create index idx_threat_feeds_active on public.threat_feeds(active, type);

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- Helper: obtener org_id del usuario actual
create or replace function public.get_user_org_id()
returns uuid
language sql stable
security definer
as $$
  select org_id from public.users where id = auth.uid()
$$;

-- Helper: obtener rol del usuario actual
create or replace function public.get_user_role()
returns text
language sql stable
security definer
as $$
  select role from public.users where id = auth.uid()
$$;

-- organizations: solo ver la propia organización
create policy "users can view own organization"
  on public.organizations for select
  using (id = public.get_user_org_id());

create policy "admins can update own organization"
  on public.organizations for update
  using (id = public.get_user_org_id() and public.get_user_role() = 'admin');

-- users: ver usuarios de la misma org
create policy "users can view own profile"
  on public.users for select
  using (org_id = public.get_user_org_id());

create policy "users can update own profile"
  on public.users for update
  using (id = auth.uid());

create policy "admins can manage org users"
  on public.users for all
  using (org_id = public.get_user_org_id() and public.get_user_role() = 'admin');

-- devices
create policy "users can view org devices"
  on public.devices for select
  using (org_id = public.get_user_org_id());

create policy "admins can manage org devices"
  on public.devices for all
  using (org_id = public.get_user_org_id() and public.get_user_role() in ('admin','analyst'));

-- syslog_raw
create policy "users can view org syslog"
  on public.syslog_raw for select
  using (org_id = public.get_user_org_id());

-- firewall_events
create policy "users can view org events"
  on public.firewall_events for select
  using (org_id = public.get_user_org_id());

-- alerts
create policy "users can view org alerts"
  on public.alerts for select
  using (org_id = public.get_user_org_id());

create policy "analysts and admins can manage alerts"
  on public.alerts for all
  using (org_id = public.get_user_org_id() and public.get_user_role() in ('admin','analyst'));

-- reports
create policy "users can view org reports"
  on public.reports for select
  using (org_id = public.get_user_org_id());

create policy "analysts and admins can create reports"
  on public.reports for insert
  with check (org_id = public.get_user_org_id() and public.get_user_role() in ('admin','analyst'));

-- threat_feeds: lectura pública (sin RLS para tabla global)
alter table public.threat_feeds enable row level security;
create policy "anyone can read threat feeds"
  on public.threat_feeds for select
  using (true);

-- ============================================================
-- TRIGGERS: updated_at automático
-- ============================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at_organizations
  before update on public.organizations
  for each row execute function public.set_updated_at();

create trigger set_updated_at_users
  before update on public.users
  for each row execute function public.set_updated_at();

create trigger set_updated_at_devices
  before update on public.devices
  for each row execute function public.set_updated_at();

create trigger set_updated_at_alerts
  before update on public.alerts
  for each row execute function public.set_updated_at();

-- ============================================================
-- TRIGGER: auto-crear usuario en public.users al registrarse
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
declare
  v_org_id uuid;
  v_org_name text;
  v_org_slug text;
begin
  -- Obtener org_name desde metadata si viene en el signup
  v_org_name := coalesce(new.raw_user_meta_data->>'org_name', 'Mi Organización');
  v_org_slug := lower(regexp_replace(v_org_name, '[^a-zA-Z0-9]', '-', 'g'));

  -- Crear organización si no viene org_id en metadata
  if new.raw_user_meta_data->>'org_id' is null then
    insert into public.organizations (name, slug, plan)
    values (v_org_name, v_org_slug || '-' || substr(gen_random_uuid()::text, 1, 8), 'free')
    returning id into v_org_id;
  else
    v_org_id := (new.raw_user_meta_data->>'org_id')::uuid;
  end if;

  -- Crear perfil de usuario
  insert into public.users (id, org_id, full_name, email, role)
  values (
    new.id,
    v_org_id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'admin')
  );

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- FUNCIÓN: limpieza automática de logs crudos según retención
-- ============================================================
create or replace function public.cleanup_old_syslog()
returns void language plpgsql security definer as $$
begin
  delete from public.syslog_raw sr
  using public.organizations o
  where sr.org_id = o.id
    and sr.received_at < now() - (o.retention_days || ' days')::interval;
end;
$$;

-- ============================================================
-- HABILITAR REALTIME para eventos en vivo
-- ============================================================
alter publication supabase_realtime add table public.firewall_events;
alter publication supabase_realtime add table public.alerts;
alter publication supabase_realtime add table public.syslog_raw;
