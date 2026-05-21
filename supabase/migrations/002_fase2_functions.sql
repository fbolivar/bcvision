-- ============================================================
-- FirewallIQ — Funciones y políticas de Fase 2
-- Aplicar DESPUÉS de 001_initial.sql
-- ============================================================

-- ============================================================
-- FUNCIÓN: Top IPs origen por org
-- ============================================================
create or replace function public.get_top_source_ips(
  p_org_id uuid,
  p_since  timestamptz,
  p_limit  integer default 10
)
returns table (
  src_ip      text,
  event_count bigint,
  bytes_total bigint,
  blocked     bigint
)
language sql stable security definer
as $$
  select
    src_ip::text,
    count(*)                                                    as event_count,
    sum(bytes_sent + bytes_received)                            as bytes_total,
    count(*) filter (where action in ('deny','drop'))           as blocked
  from public.firewall_events
  where org_id    = p_org_id
    and event_time >= p_since
    and src_ip is not null
  group by src_ip
  order by event_count desc
  limit p_limit;
$$;

-- ============================================================
-- FUNCIÓN: Actividad horaria por org (heatmap de 24h)
-- ============================================================
create or replace function public.get_hourly_activity(
  p_org_id uuid,
  p_since  timestamptz
)
returns table (
  hour_bucket timestamptz,
  total_events bigint,
  blocked_events bigint
)
language sql stable security definer
as $$
  select
    date_trunc('hour', event_time) as hour_bucket,
    count(*)                        as total_events,
    count(*) filter (where action in ('deny','drop')) as blocked_events
  from public.firewall_events
  where org_id     = p_org_id
    and event_time >= p_since
  group by hour_bucket
  order by hour_bucket;
$$;

-- ============================================================
-- FUNCIÓN: Resumen de amenazas por categoría
-- ============================================================
create or replace function public.get_threat_categories(
  p_org_id uuid,
  p_since  timestamptz
)
returns table (
  category text,
  count    bigint,
  critical bigint
)
language sql stable security definer
as $$
  select
    coalesce(threat_category, 'unknown') as category,
    count(*)                              as count,
    count(*) filter (where severity = 'critical') as critical
  from public.firewall_events
  where org_id     = p_org_id
    and event_time >= p_since
    and event_type in ('threat','block')
    and threat_category is not null
  group by threat_category
  order by count desc;
$$;

-- ============================================================
-- POLÍTICA: syslog_raw — inserción desde service_role
-- (el listener usa service_role key)
-- ============================================================
create policy "service role can insert syslog_raw"
  on public.syslog_raw for insert
  with check (true);  -- service_role bypasses RLS pero dejamos policy explícita

create policy "service role can insert firewall_events"
  on public.firewall_events for insert
  with check (true);

-- ============================================================
-- ÍNDICE adicional: búsqueda por threat_name y user_name
-- ============================================================
create index if not exists idx_fe_user_name
  on public.firewall_events(org_id, user_name)
  where user_name is not null;

create index if not exists idx_fe_url
  on public.firewall_events(org_id, url)
  where url is not null;

-- ============================================================
-- VISTA: resumen diario por dispositivo (para dashboard)
-- ============================================================
create or replace view public.device_daily_summary as
select
  fe.org_id,
  fe.device_id,
  d.name      as device_name,
  d.brand     as device_brand,
  date_trunc('day', fe.event_time) as day,
  count(*)    as total_events,
  count(*) filter (where fe.action in ('deny','drop'))       as blocked_events,
  count(*) filter (where fe.event_type = 'threat')           as threat_events,
  sum(fe.bytes_sent + fe.bytes_received)                     as bytes_total
from public.firewall_events fe
join public.devices d on d.id = fe.device_id
group by fe.org_id, fe.device_id, d.name, d.brand, date_trunc('day', fe.event_time);

-- RLS en la vista heredada desde firewall_events
