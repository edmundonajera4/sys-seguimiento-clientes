-- Protege la RPC de balance histórico en la base de datos.
-- La validación de rol no debe depender de la interfaz, que puede ser eludida.

CREATE OR REPLACE FUNCTION get_balance_historico_admin()
RETURNS TABLE (
  mes DATE,
  total_tickets BIGINT,
  ingresos_totales NUMERIC,
  costos_refacciones NUMERIC,
  ganancia_neta NUMERIC,
  entregas_realizadas BIGINT,
  ticket_promedio NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS (
    SELECT 1
    FROM public.usuarios
    WHERE auth_user_id = auth.uid()
      AND rol = 'admin'
  ) THEN
    RAISE EXCEPTION 'admin_access_required' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT * FROM public.vista_balance_mensual;
END;
$$;

-- Evita permisos implícitos y permite invocarla únicamente a sesiones autenticadas.
REVOKE ALL ON FUNCTION get_balance_historico_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION get_balance_historico_admin() TO authenticated;
