-- 007_agregar_serial_imei.sql
-- Fecha: 2026-08-03
-- Propósito: Agregar campos numero_serie e imei a la tabla tickets para mejor control de inventario

-- ======================
-- ALTERAR TABLA TICKETS
-- ======================

ALTER TABLE tickets
ADD column if not exists numero_serie VARCHAR(50),
ADD column if not exists imei VARCHAR (20);

-- Se indexa busqueda por numero_serie y imei para mejorar rendimiento de consultas frecuentes.

CREATE INDEX if not exists idx_tickets_numero_serie_imei ON tickets(numero_serie);
CREATE INDEX if not exists idx_tickets_imei ON tickets(imei);

-- Se valida por que el imei sea de 15 a 17 caracteres

ALTER TABLE tickets
DROP CONSTRAINT IF EXISTS chk_imei_format;

ALTER TABLE tickets
ADD CONSTRAINT chk_imei_format CHECK (
    imei IS NULL or
    (char_length(imei) >= 15 AND char_length(imei) <= 17 AND imei ~ '^[0-9]+$')
);

-- Comentarios en las columnas para documentación

COMMENT ON COLUMN tickets.numero_serie IS 'Numero de serie del dispositivo enviado por el cliente.';
COMMENT ON COLUMN tickets.imei IS 'IMEI del dispositivo (15 a 17 digitos) enviado para la identificacion unica del dispositivo.)';
