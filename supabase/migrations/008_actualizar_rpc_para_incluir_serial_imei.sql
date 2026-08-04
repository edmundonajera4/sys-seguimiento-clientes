-- Actualizcion de la existente RPC, migracion adicional

-- 008_actualizar_rpc_para_incluir_serial_imei.sql
-- Fecha: 2026-08-03
-- Propósito: Extender RPC get_ticket_publico para incluir numero_serie e imei

DROP FUNCTION IF EXISTS get_ticket_publico(text);

CREATE FUNCTION get_ticket_publico(p_codigo TEXT)
RETURNS TABLE (
  id UUID,
  codigo TEXT,
  estado TEXT,
  equipo_marca TEXT,
  equipo_modelo TEXT,
  falla_reportada TEXT,
  numero_serie TEXT,
  imei TEXT,
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
    t.numero_serie,
    t.imei,
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

GRANT EXECUTE ON FUNCTION get_ticket_publico(text) TO anon, authenticated;