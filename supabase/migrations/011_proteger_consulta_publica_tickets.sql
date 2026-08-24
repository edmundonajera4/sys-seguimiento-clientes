-- La consulta pública se realiza exclusivamente mediante la función de Netlify.
-- Devuelve solo estado, equipo y resumen financiero, sin PII ni notas internas.
-- Límite: 10 consultas por IP cada 10 minutos.

CREATE TABLE IF NOT EXISTS public_ticket_lookup_attempts (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ip_hash TEXT NOT NULL CHECK (ip_hash ~ '^[a-f0-9]{64}$'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_public_ticket_lookup_attempts_ip_created_at
  ON public_ticket_lookup_attempts (ip_hash, created_at DESC);

ALTER TABLE public_ticket_lookup_attempts ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public_ticket_lookup_attempts FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION get_ticket_publico_limitado(p_codigo TEXT, p_ip_hash TEXT)
RETURNS TABLE (
  codigo TEXT,
  estado TEXT,
  equipo_marca TEXT,
  equipo_modelo TEXT,
  costo_total NUMERIC,
  total_pagado NUMERIC,
  saldo NUMERIC,
  fecha_recepcion TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  intentos_recientes INTEGER;
BEGIN
  IF p_codigo !~ '^[A-HJ-NP-Z2-9]{6}$' OR p_ip_hash !~ '^[a-f0-9]{64}$' THEN
    RETURN;
  END IF;

  -- Impide que consultas paralelas de una misma IP evadan el límite.
  PERFORM pg_advisory_xact_lock(hashtextextended(p_ip_hash, 0));

  -- Los hashes se retienen solo 24 horas.
  DELETE FROM public_ticket_lookup_attempts
  WHERE created_at < now() - INTERVAL '24 hours';

  SELECT COUNT(*)
  INTO intentos_recientes
  FROM public_ticket_lookup_attempts
  WHERE ip_hash = p_ip_hash
    AND created_at >= now() - INTERVAL '10 minutes';

  IF intentos_recientes >= 10 THEN
    RAISE EXCEPTION 'rate_limit_exceeded';
  END IF;

  INSERT INTO public_ticket_lookup_attempts (ip_hash) VALUES (p_ip_hash);

  RETURN QUERY
  SELECT
    t.codigo,
    t.estado,
    t.equipo_marca,
    t.equipo_modelo,
    t.costo_total,
    COALESCE(SUM(p.monto), 0)::NUMERIC AS total_pagado,
    CASE
      WHEN t.costo_total IS NULL THEN NULL
      ELSE t.costo_total - COALESCE(SUM(p.monto), 0)
    END::NUMERIC AS saldo,
    t.fecha_recepcion
  FROM tickets AS t
  LEFT JOIN pagos AS p ON p.ticket_id = t.id
  WHERE t.codigo = p_codigo
  GROUP BY t.id;
END;
$$;

-- Las RPC antiguas exponen datos personales/técnicos y no deben ser invocables con anon key.
REVOKE ALL ON FUNCTION get_ticket_publico(TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION get_pagos_publico(TEXT) FROM PUBLIC, anon, authenticated;

-- Solo la función de Netlify, mediante service_role, puede llamar la RPC limitada.
REVOKE ALL ON FUNCTION get_ticket_publico_limitado(TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION get_ticket_publico_limitado(TEXT, TEXT) TO service_role;
