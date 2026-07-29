# Panel de administración — Taller de reparación

Panel interno para dar de alta tickets, actualizar su estado, registrar pagos/abonos,
y ver el balance mensual del negocio.

## 1. Configurar variables de entorno

Copia `.env.example` a `.env` y coloca los datos de tu proyecto de Supabase
(los encuentras en Project Settings → API):

```
cp .env.example .env
```

```
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key-publica
```

## 2. Instalar dependencias

```
npm install
```

## 3. Aplicar migraciones adicionales

Este proyecto incluye migraciones en `supabase/migrations/` que debes correr en el
**SQL Editor** de Supabase, en orden, si tu proyecto no las tiene ya:

- `002_fecha_costos_refaccion.sql` — agrega fecha a los costos de refacción (para el Balance mensual).
- `003_permisos_vista_saldo.sql` — asegura que la página pública pueda leer el saldo del ticket.

## 4. Crear tu primer usuario de staff

El login usa Supabase Auth. Para crear tu primera cuenta:

1. Ve a tu proyecto en Supabase → **Authentication → Users → Add user**.
2. Crea el usuario con tu correo y una contraseña.
3. Copia el **User UID** que se generó.
4. Ve a **Table Editor → usuarios** y crea una fila:
   - `nombre`: tu nombre
   - `rol`: `admin`
   - `auth_user_id`: pega el UID que copiaste

Repite este proceso por cada técnico que necesite acceso al panel.

## 5. Correr en desarrollo

```
npm run dev
```

Abre `http://localhost:5173` e inicia sesión con el correo/contraseña que creaste.

## 6. Desplegar (hosting)

Este proyecto está listo para desplegarse en **Vercel** o **Netlify** (plan gratuito):

1. Sube este proyecto a un repositorio de GitHub.
2. En Vercel/Netlify, importa el repositorio.
3. Agrega las mismas variables de entorno (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) en la configuración del proyecto.
4. Despliega. Vite se encarga del build automáticamente (`npm run build`).

## Qué incluye este proyecto

**Panel administrativo** (requiere login, todo bajo `/`):
- **Login** — autenticación con Supabase Auth, solo staff registrado en la tabla `usuarios` puede entrar.
- **Tickets** — lista de todos los equipos, con filtro por estado y búsqueda por código/cliente/modelo.
- **Nuevo ticket** — busca al cliente por teléfono (o lo crea si es nuevo), registra el equipo, la falla, el costo estimado y un abono inicial. Al crear el ticket, genera automáticamente el QR de seguimiento y permite imprimirlo o enviarlo por WhatsApp al cliente.
- **Detalle del ticket** — cambia el estado, registra pagos adicionales (con aviso automático cuando el saldo llega a $0), registra costos de refacción, y permite reenviar el estatus actual por WhatsApp o copiar el enlace público.
- **Administradores** (solo visible para el rol `admin`) — invita por correo a nuevos administradores o técnicos. La persona recibe un email para crear su propia contraseña; nadie en el taller la ve ni la define.
- **Recuperación de contraseña** — desde el login, cualquier usuario de staff puede pedir un enlace de recuperación por correo.

## Cómo funciona la invitación de administradores (y por qué)

Invitar usuarios requiere la **Secret key** de Supabase — la misma que nunca debe estar en el navegador, porque evade RLS. Por eso esta función vive en una **Netlify Function** (`netlify/functions/invite-admin.js`), que corre en el servidor, no en el navegador.

Además, **nunca se genera ni se envía una contraseña en texto plano**: Supabase le manda a la persona invitada un correo con un enlace para que ella misma cree su contraseña. Esto es más seguro que generar una contraseña y compartirla por correo o WhatsApp.

### Configuración necesaria en Netlify (una sola vez)

1. Ve a tu proyecto en Supabase → **Settings → API Keys**, copia la **Secret key** (no la publicable).
2. En Netlify → tu sitio → **Site settings → Environment variables**, agrega:
   ```
   SUPABASE_URL = https://tu-proyecto.supabase.co
   SUPABASE_SERVICE_ROLE_KEY = tu-secret-key
   SUPABASE_ANON_KEY = tu-publishable-key
   ```
   (Nota: sin el prefijo `VITE_` — estas son solo para la función de servidor, nunca se envían al navegador.)
3. Vuelve a desplegar el sitio (un nuevo `git push` es suficiente) para que la función tenga esas variables disponibles.

### Configuración necesaria en Supabase (una sola vez)

Ve a **Authentication → URL Configuration** y configura:
- **Site URL**: `https://tu-sitio.netlify.app`
- **Redirect URLs**: agrega `https://tu-sitio.netlify.app/actualizar-password` (y si pruebas en local, también `http://localhost:5173/actualizar-password`)

Sin este paso, los enlaces de invitación y recuperación de contraseña no funcionarán correctamente en producción.

### Cómo probarlo

1. Entra al panel con una cuenta que tenga `rol = admin` en la tabla `usuarios`.
2. Ve a la pestaña **Administradores** → invita a alguien con su nombre, correo y rol.
3. Esa persona recibe un correo, hace clic, define su contraseña, y ya puede entrar al panel.
4. Para probar la recuperación: en el login, da clic en **"¿Olvidaste tu contraseña?"**, escribe un correo válido, y revisa la bandeja de entrada.
- **Balance** — ingresos del mes con tabla detallada de pagos, costos de refacción con tabla detallada, ganancia neta, reparaciones entregadas y ticket promedio.

**Página pública** (sin login, en `/estado/:codigo`):
- La ve el cliente al escanear el QR de su ticket.
- Muestra el estado actual del equipo con un mensaje amigable, y si ya se definió un costo, el desglose de costo total, pagado y saldo pendiente.
- Si el código no existe, muestra un mensaje claro en vez de un error técnico.

## Generar el QR para imprimir

Ya no necesitas hacerlo manualmente: al crear un ticket nuevo, el panel genera el QR
automáticamente y te lleva a una pantalla con dos botones:

- **Imprimir ticket** — abre una ventana lista para imprimir con el QR, el código y el equipo.
- **Enviar por WhatsApp** — abre WhatsApp (Web o app) con un mensaje prellenado que incluye
  el enlace de seguimiento, listo para enviar al número del cliente.

También puedes reenviar el estatus más adelante (por ejemplo, cuando el equipo pase a "listo")
desde el detalle del ticket, con el botón **"Enviar estatus por WhatsApp"**.

### Nota sobre números de teléfono

El envío por WhatsApp usa enlaces `wa.me`, que no requieren API ni costo. Para armar el número
completo, el sistema asume México (+52) si el teléfono capturado tiene 10 dígitos. Si tu taller
recibe clientes de otros países, captura el teléfono incluyendo su código de país
(por ejemplo `+1...`) al crear el ticket.
