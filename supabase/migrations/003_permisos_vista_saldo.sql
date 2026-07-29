-- Asegura que el rol anónimo (usado por la página pública, sin login)
-- pueda leer la vista de saldo. Sin este permiso explícito, la página
-- pública podría recibir un error de "permission denied" al consultarla.
grant select on vista_saldo_ticket to anon, authenticated;
