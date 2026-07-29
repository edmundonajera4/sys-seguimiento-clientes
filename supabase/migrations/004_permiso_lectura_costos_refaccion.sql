-- Corrige un permiso faltante: costos_refaccion permitía insertar,
-- pero no había política de lectura (SELECT) para el staff autenticado.
-- Esto hacía que las refacciones se guardaran pero no se pudieran leer de vuelta.
create policy "Lectura de costos de refaccion para staff"
on costos_refaccion for select
using (auth.role() = 'authenticated');
