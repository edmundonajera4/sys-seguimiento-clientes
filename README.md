# Sistema de seguimiento para taller de reparación

Aplicación web para administrar la recepción, reparación, cobro y entrega de equipos. El personal opera un panel privado y cada cliente puede consultar el estado de su equipo desde un enlace o código QR.

## Objetivo

Centralizar el trabajo diario de un taller de reparación:

- Registrar clientes, equipos y fallas reportadas.
- Dar seguimiento a cada reparación mediante un ticket único.
- Controlar estados, pagos, abonos y costos de refacciones.
- Medir ingresos, costos y ganancia mensual.
- Compartir un seguimiento público seguro por QR o WhatsApp.

## Tecnologías

| Componente | Tecnología |
| --- | --- |
| Interfaz | React 18 + Vite |
| Navegación | React Router |
| Base de datos y autenticación | Supabase |
| Código QR | `qrcode` |
| Funciones de servidor | Netlify Functions |
| Hosting recomendado | Netlify |

## Funcionalidades disponibles

### Panel privado

El panel requiere una sesión de Supabase y que el usuario exista en la tabla `usuarios`.

- **Inicio de sesión:** acceso del personal mediante correo y contraseña.
- **Listado de tickets:** consulta todos los equipos y busca por código, cliente, marca, modelo, número de serie, IMEI o falla.
- **Alta de ticket:** localiza o crea clientes por teléfono, registra marca, modelo, serie, IMEI, falla, costo estimado y abono inicial.
- **Código QR:** al crear un ticket genera un QR para imprimir y un enlace público para seguimiento.
- **WhatsApp:** prepara mensajes de seguimiento con el enlace público. Los números mexicanos de diez dígitos reciben el prefijo `+52` automáticamente.
- **Detalle del ticket:** permite cambiar el estado, registrar pagos y costos de refacciones, copiar el enlace público y reenviar el estado por WhatsApp.
- **Balance mensual:** muestra ingresos por pagos, costos de refacciones, ganancia neta, entregas y ticket promedio del mes actual.
- **Balance histórico:** disponible para administradores; consolida los balances por mes.
- **Gestión de usuarios:** un administrador puede invitar administradores o técnicos mediante correo. La persona invitada define su propia contraseña; el taller nunca conoce ni almacena contraseñas.
- **Cambio de contraseña:** un usuario autenticado puede actualizar su contraseña desde el panel.

### Seguimiento público del cliente

La ruta pública es `/estado/:codigo` y se obtiene al escanear el QR o abrir el enlace de WhatsApp.

El cliente puede ver únicamente:

- Estado de la reparación.
- Marca y modelo del equipo.
- Fecha de recepción.
- Costo total, total pagado y saldo, cuando el costo ya fue definido.

No se exponen nombre, teléfono, falla reportada, notas internas, serial, IMEI ni el historial individual de pagos.

La consulta está protegida por una Netlify Function y limitada a **10 solicitudes por IP cada 10 minutos**. La base conserva durante un máximo de 24 horas un hash con salt de la IP, nunca la IP real.

## Rutas

| Ruta | Acceso | Descripción |
| --- | --- | --- |
| `/login` | Público | Inicio de sesión del personal. |
| `/actualizar-password` | Público con enlace válido de Supabase | Activación o actualización de contraseña tras una invitación. |
| `/estado/:codigo` | Público | Seguimiento seguro del ticket. |
| `/tickets` | Personal autenticado | Listado y búsqueda de tickets. |
| `/tickets/nuevo` | Personal autenticado | Registro de un ticket. |
| `/tickets/:id` | Personal autenticado | Detalle, pagos, costos y estado del ticket. |
| `/balance` | Personal autenticado | Balance del mes actual. |
| `/balance-historico` | Administrador | Balance consolidado por mes. |
| `/admins` | Administrador | Invitación de nuevos miembros del personal. |
| `/password` | Personal autenticado | Cambio de contraseña. |

## Requisitos

- Node.js 18 o superior.
- Un proyecto de Supabase con las tablas base del taller (`usuarios`, `clientes`, `tickets`, `pagos` y `costos_refaccion`).
- Una cuenta de Netlify para las funciones de invitación y consulta pública protegida.

## Configuración local

### 1. Instalar dependencias

```bash
npm install
```

### 2. Crear el archivo `.env`

Crea un archivo `.env` en la raíz del proyecto. Estas claves son públicas para el navegador y corresponden a la anon key de Supabase; nunca coloques aquí la service-role key.

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key-publica
```

### 3. Iniciar el proyecto

```bash
npm run dev
```

Abre `http://localhost:5173`.

### 4. Generar una compilación de producción

```bash
npm run build
```

El resultado se genera en `dist/`.

## Configuración de Supabase

### Migraciones

Las migraciones incluidas complementan un esquema base ya existente. Ejecuta los archivos de `supabase/migrations/` en orden numérico en el **SQL Editor** de Supabase, especialmente si estás creando un ambiente nuevo.

| Migración | Propósito |
| --- | --- |
| `002_fecha_costos_refaccion.sql` | Fecha e índice para los costos de refacciones. |
| `003_permisos_vista_saldo.sql` | Permisos relacionados con el saldo público original. |
| `004_permiso_lectura_costos_refaccion.sql` | Permisos de lectura para costos de refacción. |
| `005_restriccion_lectura_publica.sql` | Primera restricción de lectura pública. |
| `006_correccion_rls_y_rpc_publico.sql` | Corrección de RLS y RPC públicas previas. |
| `007_agregar_serial_imei.sql` | Campos e índices para serial e IMEI. |
| `008_actualizar_rpc_para_incluir_serial_imei.sql` | Actualización histórica de RPC. |
| `009_vista_balance_mensual.sql` | Vista y permisos del balance mensual. |
| `010_get_balance_historico_admin.sql` | RPC de balance histórico. |
| `011_proteger_consulta_publica_tickets.sql` | Protección actual del seguimiento público, datos mínimos y límite por IP. **Obligatoria** para producción. |

> La migración 011 revoca el uso público de las RPC anteriores y las reemplaza por una RPC exclusiva para la función de servidor. No la omitas al desplegar esta versión.

### Primer usuario administrador

1. En Supabase abre **Authentication → Users → Add user**.
2. Crea el usuario con correo y contraseña.
3. Copia su **User UID**.
4. En **Table Editor → usuarios**, crea una fila con:

   | Campo | Valor |
   | --- | --- |
   | `nombre` | Nombre de la persona. |
   | `rol` | `admin`. |
   | `auth_user_id` | El UID creado en Supabase Auth. |

Después, el administrador puede invitar técnicos o más administradores desde el panel.

### URLs de autenticación

En **Authentication → URL Configuration** configura:

```text
Site URL: https://tu-sitio.netlify.app
Redirect URLs:
https://tu-sitio.netlify.app/actualizar-password
http://localhost:5173/actualizar-password
```

La URL local solo es necesaria para pruebas. Cambia el dominio de producción por el definitivo.

## Configuración de Netlify

Netlify ejecuta dos funciones de servidor:

| Función | Uso |
| --- | --- |
| `invite-admin.cjs` | Verifica al administrador e invita personal mediante Supabase Auth. |
| `public-ticket.cjs` | Consulta el estado público, aplica el límite por IP y devuelve los campos autorizados. |

En **Site configuration → Environment variables**, configura estas variables de producción:

```text
SUPABASE_URL = https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY = tu-secret-key-de-supabase
SUPABASE_ANON_KEY = tu-anon-key-publica
PUBLIC_LOOKUP_RATE_LIMIT_SALT = un-secreto-unico-aleatorio-de-32-caracteres-o-mas
```

Reglas importantes:

- No uses el prefijo `VITE_` para esas variables; deben permanecer en el servidor.
- Nunca expongas `SUPABASE_SERVICE_ROLE_KEY` en el código cliente, `.env` frontend ni repositorios.
- `PUBLIC_LOOKUP_RATE_LIMIT_SALT` debe ser secreto y estable. Si se cambia, los hashes de IP anteriores dejan de coincidir, algo seguro pero que reinicia los límites activos.
- El archivo [netlify.toml](netlify.toml) ya define el comando de build, la carpeta publicada y el directorio de funciones.

## Despliegue

1. Sube el proyecto a GitHub.
2. Importa el repositorio en Netlify.
3. Configura las variables de entorno anteriores.
4. Ejecuta todas las migraciones necesarias en Supabase, incluida la `011`.
5. Configura las URL de autenticación en Supabase.
6. Despliega la aplicación.

Netlify ejecutará `npm run build`, publicará `dist/` y habilitará las funciones dentro de `netlify/functions/`.

## Personalización del negocio

Actualiza [src/config.js](src/config.js) con los datos reales del taller. Estos valores aparecen en el ticket impreso y en la interfaz:

```js
export const NEGOCIO = {
  nombre: 'Taller de reparación',
  direccion: 'Calle Ejemplo #123, Col. Centro, Aguascalientes, Ags.',
  telefono: '449 123 4567',
  agradecimiento: '¡Gracias por confiar en nosotros para reparar tu equipo!',
}
```

## Flujo de operación

1. El personal inicia sesión.
2. Registra un ticket y, si hace falta, un cliente nuevo.
3. El sistema crea el código del ticket, QR y enlace de WhatsApp.
4. El técnico actualiza el estado y registra pagos o refacciones conforme avanza el trabajo.
5. El cliente consulta el enlace público sin necesidad de crear una cuenta.
6. El administrador consulta balances e invita a nuevos miembros del equipo.

## Verificación antes de publicar

- Ejecuta `npm run build`.
- Comprueba inicio de sesión, creación de ticket y detalle del ticket.
- Verifica que el QR abra `/estado/:codigo` y que solo muestre los campos autorizados.
- Prueba una invitación de usuario y la ruta `/actualizar-password`.
- Confirma que Netlify tiene las cuatro variables de servidor configuradas.
- Realiza hasta 10 consultas públicas válidas desde una IP; la siguiente debe recibir un límite temporal de consultas.
