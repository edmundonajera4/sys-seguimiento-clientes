// Esta función corre en el SERVIDOR de Netlify, nunca en el navegador.
// Por eso es el único lugar donde es seguro usar la Secret key de Supabase.
const { createClient } = require('@supabase/supabase-js')

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Método no permitido' }) }
  }

  // 0. Verificar que las variables de entorno existan ANTES de usarlas.
  //    Esto es lo primero que revisamos: si falta una, no tiene caso seguir.
  const faltantes = []
  if (!process.env.SUPABASE_URL) faltantes.push('SUPABASE_URL')
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) faltantes.push('SUPABASE_SERVICE_ROLE_KEY')
  if (!process.env.SUPABASE_ANON_KEY) faltantes.push('SUPABASE_ANON_KEY')

  if (faltantes.length > 0) {
    console.error('[invite-admin] Variables de entorno faltantes:', faltantes.join(', '))
    return {
      statusCode: 500,
      body: JSON.stringify({ error: `Faltan variables de entorno en Netlify: ${faltantes.join(', ')}` }),
    }
  }

  const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  const supabaseAuth = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)

  try {
    // 1. Verificar que quien llama esté logueado y sea admin.
    const authHeader = event.headers.authorization || ''
    const token = authHeader.replace('Bearer ', '')

    if (!token) {
      console.error('[invite-admin] Petición sin token de autorización')
      return { statusCode: 401, body: JSON.stringify({ error: 'No autenticado' }) }
    }

    const { data: userData, error: userError } = await supabaseAuth.auth.getUser(token)
    if (userError || !userData?.user) {
      console.error('[invite-admin] Token inválido:', userError?.message)
      return { statusCode: 401, body: JSON.stringify({ error: 'Sesión inválida: ' + (userError?.message || '') }) }
    }
    console.log('[invite-admin] Usuario que invita:', userData.user.id, userData.user.email)

    const { data: usuarioActual, error: rolError } = await supabaseAdmin
      .from('usuarios')
      .select('rol')
      .eq('auth_user_id', userData.user.id)
      .maybeSingle()

    if (rolError) {
      console.error('[invite-admin] Error consultando rol:', rolError.message)
      return { statusCode: 500, body: JSON.stringify({ error: 'Error consultando permisos: ' + rolError.message }) }
    }

    console.log('[invite-admin] Rol encontrado:', usuarioActual?.rol)

    if (usuarioActual?.rol !== 'admin') {
      return { statusCode: 403, body: JSON.stringify({ error: 'Solo un administrador puede invitar nuevo staff (rol actual: ' + (usuarioActual?.rol || 'sin registro') + ')' }) }
    }

    // 2. Leer los datos del nuevo administrador/técnico a invitar.
    const { nombre, email, rol, redirectTo } = JSON.parse(event.body || '{}')

    if (!nombre || !email || !rol) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Faltan datos (nombre, email o rol)' }) }
    }

    console.log('[invite-admin] Invitando a:', email, 'rol:', rol, 'redirectTo:', redirectTo)

    // 3. Invitar por correo. Supabase crea el usuario y le envía un email
    //    con un enlace para que ÉL MISMO defina su contraseña — nunca
    //    generamos ni enviamos una contraseña en texto plano.
    const { data: invitado, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email,
      { redirectTo }
    )

    if (inviteError) {
      console.error('[invite-admin] Error de Supabase al invitar:', inviteError.status, inviteError.message)
      return { statusCode: 400, body: JSON.stringify({ error: inviteError.message, status: inviteError.status }) }
    }

    console.log('[invite-admin] Usuario invitado creado en Auth:', invitado.user.id)

    // 4. Crear el registro correspondiente en la tabla usuarios.
    const { error: usuarioError } = await supabaseAdmin.from('usuarios').insert({
      nombre,
      rol,
      auth_user_id: invitado.user.id,
    })

    if (usuarioError) {
      console.error('[invite-admin] Error insertando en usuarios:', usuarioError.message)
      return { statusCode: 400, body: JSON.stringify({ error: usuarioError.message }) }
    }

    console.log('[invite-admin] Invitación completada con éxito para', email)
    return { statusCode: 200, body: JSON.stringify({ ok: true }) }
  } catch (err) {
    console.error('[invite-admin] Excepción no controlada:', err.message)
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}
