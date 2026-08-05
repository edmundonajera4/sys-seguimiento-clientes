   supabase/migrations/009_vista_balance_mensual.sql
   ```

2. **Contenido completo:**
   ```sql
   -- 009_vista_balance_mensual.sql
   -- Fecha: 2024-08-04
   
   CREATE OR REPLACE VIEW vista_balance_mensual AS
   SELECT
     DATE_TRUNC('month', t.fecha_recepcion)::DATE AS mes,
     COUNT(DISTINCT t.id) AS total_tickets,
     SUM(t.costo_total) FILTER (WHERE t.costo_total IS NOT NULL) AS ingresos_totales,
     COALESCE(SUM(cr.costo), 0) AS costos_refacciones,
     (SUM(t.costo_total) FILTER (WHERE t.costo_total IS NOT NULL)) - 
     COALESCE(SUM(cr.costo), 0) AS ganancia_neta,
     COUNT(DISTINCT t.id) FILTER (WHERE t.estado = 'entregado') AS entregas_realizadas,
     CASE 
       WHEN COUNT(DISTINCT t.id) > 0 
       THEN (SUM(t.costo_total) FILTER (WHERE t.costo_total IS NOT NULL)) / COUNT(DISTINCT t.id)
       ELSE 0 
     END AS ticket_promedio
   FROM tickets t
   LEFT JOIN costos_refaccion cr ON cr.ticket_id = t.id
   GROUP BY DATE_TRUNC('month', t.fecha_recepcion)
   ORDER BY mes DESC;
   
   ALTER TABLE vista_balance_mensual ENABLE ROW LEVEL SECURITY;
   
   CREATE POLICY "Staff puede leer balance mensual"
   ON vista_balance_mensual FOR SELECT
   TO authenticated
   USING (
     EXISTS (
       SELECT 1 FROM usuarios
       WHERE usuarios.auth_user_id = auth.uid()
     )
   );
   
   REVOKE SELECT ON vista_balance_mensual FROM anon;
   ```

3. **Aplica en Supabase SQL Editor:**
   - Copia y pega todo el contenido
   - Click **"RUN"**
   - Verifica que NO haya errores

4. **Git commit:**
   ```bash
   git add supabase/migrations/009_vista_balance_mensual.sql
   git commit -m "feat(db): agregar vista vista_balance_mensual"
   git push origin main
   ```

---

## 2.2 Crear y aplicar Migración 010

1. **En tu computadora**, crea el archivo:
   ```
   supabase/migrations/010_get_balance_historico_admin.sql
   ```

2. **Contenido completo:**
   ```sql
   -- 010_get_balance_historico_admin.sql
   -- Fecha: 2024-08-04
   
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
   ```

3. **Aplica en Supabase SQL Editor:**
   - Pega contenido
   - Click **"RUN"**

4. **Git commit:**
   ```bash
   git add supabase/migrations/010_get_balance_historico_admin.sql
   git commit -m "feat(db): agregar RPC get_balance_historico_admin"
   git push origin main
   ```

---

# 📋 PASO 3: CREAR COMPONENTE BALANCE HISTÓRICO

Crea el archivo `src/components/BalanceHistorico.jsx` con este contenido **exacto**: