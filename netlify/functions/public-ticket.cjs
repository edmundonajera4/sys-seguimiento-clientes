const crypto = require('crypto')
const { createClient } = require('@supabase/supabase-js')

const CODE_PATTERN = /^[A-HJ-NP-Z2-9]{6}$/
const RATE_LIMIT_WINDOW_MINUTES = 10

function json(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
    body: JSON.stringify(body),
  }
}

function getClientIp(headers) {
  // Solo confiamos en la cabecera que Netlify genera en producción. El fallback
  // existe únicamente para `netlify dev`; x-forwarded-for puede ser falsificada.
  if (headers['x-nf-client-connection-ip']) return headers['x-nf-client-connection-ip'].trim()
  if (process.env.NETLIFY_DEV && headers['x-forwarded-for']) {
    return headers['x-forwarded-for'].split(',')[0].trim()
  }
  return ''
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') return json(405, { error: 'Método no permitido' })

  const codigo = String(event.queryStringParameters?.codigo || '').trim().toUpperCase()
  if (!CODE_PATTERN.test(codigo)) return json(404, { error: 'Ticket no encontrado' })

  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, PUBLIC_LOOKUP_RATE_LIMIT_SALT } = process.env
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !PUBLIC_LOOKUP_RATE_LIMIT_SALT) {
    console.error('[public-ticket] Configuración de servidor incompleta')
    return json(503, { error: 'El seguimiento no está disponible temporalmente' })
  }

  const clientIp = getClientIp(event.headers || {})
  if (!clientIp) return json(503, { error: 'El seguimiento no está disponible temporalmente' })

  // Solo se conserva el hash con salt de la IP, nunca la IP original.
  const ipHash = crypto.createHash('sha256').update(`${PUBLIC_LOOKUP_RATE_LIMIT_SALT}:${clientIp}`).digest('hex')
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  const { data, error } = await supabase.rpc('get_ticket_publico_limitado', { p_codigo: codigo, p_ip_hash: ipHash })

  if (error) {
    if (error.message?.includes('rate_limit_exceeded')) {
      return json(429, { error: `Demasiadas consultas. Intenta de nuevo en ${RATE_LIMIT_WINDOW_MINUTES} minutos.` })
    }
    console.error('[public-ticket] Error consultando ticket:', error.message)
    return json(503, { error: 'El seguimiento no está disponible temporalmente' })
  }

  if (!data?.[0]) return json(404, { error: 'Ticket no encontrado' })
  return json(200, { ticket: data[0] })
}
