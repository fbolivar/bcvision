import { createClient } from '@/lib/supabase/client'
import type { Device, FirewallBrand } from '@/shared/types/database'

export async function getDevices(orgId: string): Promise<Device[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('devices')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })
  return (data ?? []) as Device[]
}

export async function createDevice(orgId: string, payload: {
  name: string
  ip_address: string
  brand: FirewallBrand
  model?: string
  location?: string
}) {
  const supabase = createClient()
  return supabase
    .from('devices')
    .insert({ ...payload, org_id: orgId })
    .select()
    .single()
}

export async function toggleDevice(deviceId: string, active: boolean) {
  const supabase = createClient()
  return supabase
    .from('devices')
    .update({ active })
    .eq('id', deviceId)
}

export async function deleteDevice(deviceId: string) {
  const supabase = createClient()
  return supabase.from('devices').delete().eq('id', deviceId)
}

export async function updateDevice(deviceId: string, payload: { name?: string; ip_address?: string; model?: string; location?: string }) {
  const supabase = createClient()
  return supabase.from('devices').update(payload).eq('id', deviceId).select().single()
}

export async function getDeviceEventCount(deviceId: string, hours = 24): Promise<number> {
  const supabase = createClient()
  const since = new Date(Date.now() - hours * 3600_000).toISOString()
  const { count } = await supabase
    .from('firewall_events')
    .select('id', { count: 'exact', head: true })
    .eq('device_id', deviceId)
    .gte('event_time', since)
  return count ?? 0
}
