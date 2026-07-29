-- Agrega fecha de registro a costos_refaccion, para poder filtrar por mes en el Balance.
alter table costos_refaccion
  add column if not exists fecha timestamptz not null default now();

create index if not exists idx_costos_refaccion_fecha on costos_refaccion(fecha);
