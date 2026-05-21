import { NextResponse }               from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

const BUCKET     = 'org-logos'
const MAX_BYTES  = 2 * 1024 * 1024 // 2 MB
const ALLOWED    = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml']
const EXT_MAP: Record<string, string> = {
  'image/png':  'png',
  'image/jpeg': 'jpg',
  'image/jpg':  'jpg',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
}

async function getAdminProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado', status: 401 }

  const { data: profile } = await supabase
    .from('users').select('org_id, role').eq('id', user.id).single()
  if (!profile?.org_id)             return { error: 'Sin organización', status: 403 }
  if (!['admin', 'super_admin'].includes(profile.role))
                                    return { error: 'Solo administradores', status: 403 }
  return { orgId: profile.org_id }
}

// POST /api/org-settings/logo — sube un logo al bucket y guarda la URL
export async function POST(request: Request) {
  const auth = await getAdminProfile()
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const { orgId } = auth

  const formData  = await request.formData()
  const file      = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No se recibió ningún archivo' }, { status: 400 })
  if (!ALLOWED.includes(file.type)) return NextResponse.json({ error: 'Formato no válido. Usa PNG, JPG, WebP o SVG.' }, { status: 400 })
  if (file.size > MAX_BYTES) return NextResponse.json({ error: 'El archivo supera 2 MB' }, { status: 400 })

  const ext  = EXT_MAP[file.type] ?? 'png'
  const path = `${orgId}/logo.${ext}`

  const admin      = createAdminClient()
  const arrayBuf   = await file.arrayBuffer()
  const uint8      = new Uint8Array(arrayBuf)

  // Borrar archivos anteriores con cualquier extensión
  for (const e of Object.values(EXT_MAP)) {
    if (e !== ext) await admin.storage.from(BUCKET).remove([`${orgId}/logo.${e}`])
  }

  const { error: uploadErr } = await admin.storage
    .from(BUCKET)
    .upload(path, uint8, { contentType: file.type, upsert: true })

  if (uploadErr) {
    console.error('[logo/POST] upload error:', uploadErr)
    return NextResponse.json({ error: 'Error subiendo el archivo' }, { status: 500 })
  }

  const { data: { publicUrl } } = admin.storage.from(BUCKET).getPublicUrl(path)

  // Guardar URL en org_settings (upsert)
  const { data: existing } = await admin.from('org_settings').select('id').eq('org_id', orgId).single()
  if (existing) {
    await admin.from('org_settings')
      .update({ logo_url: publicUrl, updated_at: new Date().toISOString() })
      .eq('org_id', orgId)
  } else {
    await admin.from('org_settings').insert({ org_id: orgId, logo_url: publicUrl })
  }

  return NextResponse.json({ ok: true, logo_url: publicUrl })
}

// DELETE /api/org-settings/logo — elimina el logo
export async function DELETE() {
  const auth = await getAdminProfile()
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const { orgId } = auth

  const admin = createAdminClient()
  // Borrar todas las variantes
  for (const ext of Object.values(EXT_MAP)) {
    await admin.storage.from(BUCKET).remove([`${orgId}/logo.${ext}`])
  }
  await admin.from('org_settings')
    .update({ logo_url: null, updated_at: new Date().toISOString() })
    .eq('org_id', orgId)

  return NextResponse.json({ ok: true })
}
