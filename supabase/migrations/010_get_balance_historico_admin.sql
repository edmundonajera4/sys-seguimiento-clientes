-- 010_get_balance_historico_admin.sql
   
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
   LANGUAGE sql
   SECURITY DEFINER
   SET search_path = public
   AS $$
     SELECT * FROM vista_balance_mensual;
   $$;
   
   GRANT EXECUTE ON FUNCTION get_balance_historico_admin() TO authenticated;
   REVOKE EXECUTE ON FUNCTION get_balance_historico_admin() FROM anon;