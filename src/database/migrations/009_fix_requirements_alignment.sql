-- 009_fix_requirements_alignment.sql
-- Eliminar columnas de precio y tabla de clientes para cumplir con GUIA_PROYECTO.md

-- Revertir 006 (Precios fijos)
ALTER TABLE KS_SERVICIOS DROP COLUMN SV_PRECIO;
ALTER TABLE KS_PRODUCTOS DROP COLUMN PR_PRECIO;

-- Revertir 008 (Tabla de clientes previa)
-- Primero quitar la FK en facturas
ALTER TABLE KS_FACTURAS DROP FOREIGN KEY FK_FACTURA_CLIENTE;
ALTER TABLE KS_FACTURAS DROP COLUMN CL_IDCLIENTE_FK;

-- Eliminar la tabla que no debe existir según requerimientos
DROP TABLE IF EXISTS KS_CLIENTES;
