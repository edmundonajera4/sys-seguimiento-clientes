-- 004_restriccion_lectura_publica.sql
-- Fecha: 2026-08-03
-- Propósito: Restringir lectura pública de tickets y pagos para exigir coincidencia exacta por código

-- ======================
-- TABLA TICKETS
-- ======================

-- Primero, eliminamos la política actual de lectura pública (si existe)
DROP POLICY IF EXISTS "Tickets publicos visibles por códigos" ON tickets;

-- Creamos nueva política que exige coincidencia EXACTA del código
CREATE POLICY "Tickets públicos visibles solo por código exacto"
ON tickets FOR SELECT
USING (
  -- Permite lectura si:
  -- 1. El usuario está autenticado como staff (admin o técnico) → pueden ver TODO
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM usuarios
    WHERE usuarios.auth_user_id = auth.uid()
  )
  OR
  -- 2. Es lectura pública ANÓNIMA con coincidencia de código (para página /estado/:CODIGO)
  (
    auth.role() = 'anon' AND
    codigo = current_setting('request.headers::json->>' 'ticket-code', true)
  )
);

-- ======================
-- TABLA PAGOS
-- ======================

DROP POLICY IF EXISTS "Pagos públicos visibles por código" ON pagos;

CREATE POLICY "Pagos públicos visibles solo por código exacto"
ON pagos FOR SELECT
USING (
  -- Staff autenticado puede ver todo
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM usuarios
    WHERE usuarios.auth_user_id = auth.uid()
  )
  OR
  -- Público anónimo puede ver solo si el código del ticket coincide
  (
    auth.role() = 'anon' AND
    EXISTS (
      SELECT 1 FROM tickets
      WHERE tickets.id = pagos.ticket_id AND
            tickets.codigo = current_setting('request.headers::json->>' 'ticket-code', true)
    )
  )
);