import { createHash } from 'crypto'

export const WOMPI_PUBLIC_KEY  = process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY  ?? ''
export const WOMPI_PRIVATE_KEY = process.env.WOMPI_PRIVATE_KEY             ?? ''
export const WOMPI_EVENTS_KEY  = process.env.WOMPI_EVENTS_KEY              ?? ''
export const WOMPI_INTEGRITY_KEY = process.env.WOMPI_INTEGRITY_KEY         ?? ''

export const WOMPI_BASE_URL = 'https://api.wompi.co/v1'

// Genera el hash de integridad requerido por el widget de Wompi
// SHA256(reference + amount_in_cents + currency + expiration_time + integrity_key)
export function buildIntegrityHash(
  reference: string,
  amountInCents: number,
  currency: string,
  expirationTime: string,
): string {
  const raw = `${reference}${amountInCents}${currency}${expirationTime}${WOMPI_INTEGRITY_KEY}`
  return createHash('sha256').update(raw).digest('hex')
}

// Referencia única por factura
export function buildReference(orgSlug: string, invoiceId: string): string {
  return `BCVision-${orgSlug}-${invoiceId}`
}

// Verifica la firma del webhook de Wompi
// SHA256(timestamp + events_key + checksum_properties)
export function verifyWebhookSignature(
  payload: Record<string, unknown>,
  receivedChecksum: string,
): boolean {
  try {
    const event = payload.data as Record<string, unknown>
    const transaction = event?.transaction as Record<string, unknown>

    const properties = [
      String(transaction?.id ?? ''),
      String(transaction?.status ?? ''),
      String(transaction?.amount_in_cents ?? ''),
    ]

    const timestamp  = String((payload as Record<string, unknown>).timestamp ?? '')
    const raw = `${timestamp}${WOMPI_EVENTS_KEY}${properties.join('')}`
    const computed = createHash('sha256').update(raw).digest('hex')
    return computed === receivedChecksum
  } catch {
    return false
  }
}

export interface WompiCheckoutParams {
  publicKey:       string
  currency:        string
  amountInCents:   number
  reference:       string
  expirationTime:  string
  integrityHash:   string
  customerEmail?:  string
  redirectUrl:     string
}

// Construye todos los parámetros necesarios para el widget de Wompi
export function buildCheckoutParams(opts: {
  orgSlug:       string
  invoiceId:     string
  amountInCents: number
  customerEmail?: string
}): WompiCheckoutParams {
  const reference      = buildReference(opts.orgSlug, opts.invoiceId)
  const expirationTime = new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 min
  const integrityHash  = buildIntegrityHash(reference, opts.amountInCents, 'COP', expirationTime)
  const appUrl         = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  return {
    publicKey:      WOMPI_PUBLIC_KEY,
    currency:       'COP',
    amountInCents:  opts.amountInCents,
    reference,
    expirationTime,
    integrityHash,
    customerEmail:  opts.customerEmail,
    redirectUrl:    `${appUrl}/settings?tab=billing&ref=${reference}`,
  }
}
