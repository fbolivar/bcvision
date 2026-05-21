import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization') ?? ''
  const apiKey = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''

  if (!apiKey) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createAdminClient()
  const { data } = await supabase
    .from('agent_api_keys')
    .select('id, org_id')
    .eq('api_key', apiKey)
    .eq('active', true)
    .single()

  if (!data) return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })

  return NextResponse.json({ ok: true, org_id: data.org_id })
}
