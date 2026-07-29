// Esta función corre en el SERVIDOR de Netlify, nunca en el navegador.
// Por eso es el único lugar donde es seguro usar la Secret key de Supabase.
const { createClient } = require('@supabase/supabase-js')

// Cliente "admin": usa la Secret key, puede crear/invitar usuarios.
// SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY se configuran en Netlify
// (Site settings → Environment variables), NUNCA con prefijo VITE_.
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Cliente "normal": solo para verificar quién está llamando a esta función.
const supabaseAuth = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Método no permitido' }) }
  }

  try {
    // 1. Verificar que quien llama esté logueado y sea admin.
    const authHeader = event.headers.authorization || ''
    const token = authHeader.replace('Bearer ', '')

    if (!token) {
      return { statusCode: 401, body: JSON.stringify({ error: 'No autenticado' }) }
    }

    const { data: userData, error: userError } = await supabaseAuth.auth.getUser(token)
    if (userError || !userData?.user) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Sesión inválida' }) }
    }

    const { data: usuarioActual } = await supabaseAdmin
      .from('usuarios')
      .select('rol')
      .eq('auth_user_id', userData.user.id)
      .maybeSingle()

    if (usuarioActual?.rol !== 'admin') {
      return { statusCode: 403, body: JSON.stringify({ error: 'Solo un administrador puede invitar nuevo staff' }) }
    }

    // 2. Leer los datos del nuevo administrador/técnico a invitar.
    const { nombre, email, rol, redirectTo } = JSON.parse(event.body || '{}')

    if (!nombre || !email || !rol) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Faltan datos (nombre, email o rol)' }) }
    }

    // 3. Invitar por correo. Supabase crea el usuario y le envía un email
    //    con un enlace para que ÉL MISMO defina su contraseña — nunca
    //    generamos ni enviamos una contraseña en texto plano.
    const { data: invitado, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email,
      { redirectTo }
    )

    if (inviteError) {
      return { statusCode: 400, body: JSON.stringify({ error: inviteError.message }) }
    }

    // 4. Crear el registro correspondiente en la tabla usuarios.
    const { error: usuarioError } = await supabaseAdmin.from('usuarios').insert({
      nombre,
      rol,
      auth_user_id: invitado.user.id,
    })

    if (usuarioError) {
      return { statusCode: 400, body: JSON.stringify({ error: usuarioError.message }) }
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true }) }
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}
