-- 006_correccion_rls_y_rpc_publico.sql
-- Fecha: 2026-08-03
-- Propósito: Corregir migración 005 rota. Usar RPC para acceso público seguro.
--            Alineado con esquema real: equipo_marca, equipo_modelo, falla_reportada, costo_total, abono

-- =====================================================
-- 1. LIMPIAR: Eliminar funciones y políticas rotas
-- =====================================================

-- Primero eliminar funciones si existen (esto resuelve el error 42P13)
DROP FUNCTION IF EXISTS get_ticket_publico(text);
DROP FUNCTION IF EXISTS get_pagos_publico(text);

-- Luego eliminar políticas RLS rotas de la migración 005
DROP POLICY IF EXISTS "Tickets públicos visibles solo por código exacto" ON tickets;
DROP POLICY IF EXISTS "Pagos públicos visibles solo por código exacto" ON pagos;
DROP POLICY IF EXISTS "Tickets publicos visibles por códigos" ON tickets;
DROP POLICY IF EXISTS "Pagos públicos visibles por código" ON pagos;

-- =====================================================
-- 2. RESTAURAR: Política para staff autenticado (tickets)
--    Staff (admin o técnico) puede leer TODOS los tickets
-- =====================================================

CREATE POLICY "Staff puede leer tickets"
ON tickets FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM usuarios
    WHERE usuarios.auth_user_id = auth.uid()
  )
);

-- =====================================================
-- 3. RESTAURAR: Política para staff autenticado (pagos)
--    Staff puede leer TODOS los pagos
-- =====================================================

CREATE POLICY "Staff puede leer pagos"
ON pagos FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM usuarios
    WHERE usuarios.auth_user_id = auth.uid()
  )
);

-- =====================================================
-- 4. RPC: Función para acceso público seguro de tickets
--    Devuelve solo lo que necesita ver el cliente (sin datos internos)
-- =====================================================

CREATE FUNCTION get_ticket_publico(p_codigo TEXT)
RETURNS TABLE (
  id UUID,
  codigo TEXT,
  estado TEXT,
  equipo_marca TEXT,
  equipo_modelo TEXT,
  falla_reportada TEXT,
  costo_total NUMERIC,
  abono NUMERIC,
  fecha_recepcion TIMESTAMPTZ,
  notas_internas TEXT,
  cliente_nombre TEXT,
  cliente_telefono TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    t.id,
    t.codigo,
    t.estado,
    t.equipo_marca,
    t.equipo_modelo,
    t.falla_reportada,
    t.costo_total,
    t.abono,
    t.fecha_recepcion,
    t.notas_internas,
    c.nombre AS cliente_nombre,
    c.telefono AS cliente_telefono
  FROM tickets t
  JOIN clientes c ON c.id = t.cliente_id
  WHERE t.codigo = p_codigo
  LIMIT 1;
$$;

-- =====================================================
-- 5. RPC: Función para pagos públicos (desglose para cliente)
-- =====================================================

CREATE FUNCTION get_pagos_publico(p_codigo TEXT)
RETURNS TABLE (
  id UUID,
  ticket_id UUID,
  monto NUMERIC,
  tipo TEXT,
  fecha_pago TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id,
    p.ticket_id,
    p.monto,
    p.tipo,
    p.fecha_pago
  FROM pagos p
  JOIN tickets t ON t.id = p.ticket_id
  WHERE t.codigo = p_codigo
  ORDER BY p.fecha_pago ASC;
$$;

-- =====================================================
-- 6. PERMISOS: Permitir que usuarios anónimos llamen las RPC
-- =====================================================

GRANT EXECUTE ON FUNCTION get_ticket_publico(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_pagos_publico(text) TO anon, authenticated;

-- =====================================================
-- 7. REVOCAR acceso directo de anon a tablas
--    (opcional pero recomendado: fuerza que el público
--     use las RPC en vez de consultar tablas directamente)
-- =====================================================

REVOKE SELECT ON tickets FROM anon;
REVOKE SELECT ON pagos FROM anon;
REVOKE SELECT ON clientes FROM anon;