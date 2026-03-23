-- 021_add_description_to_gastos.sql
-- Agregar columna de descripción para separar del concepto general

ALTER TABLE KS_GASTOS
ADD COLUMN GS_DESCRIPCION VARCHAR(255) AFTER GS_CONCEPTO;

-- Actualizar registros existentes para que el concepto sea el mismo que la descripción si es necesario,
-- o simplemente dejarlo vacío. Por ahora lo dejamos como NULL permitido o vacío.
UPDATE KS_GASTOS SET GS_DESCRIPCION = GS_CONCEPTO WHERE GS_DESCRIPCION IS NULL;
