-- 020_add_cuotas_to_adelantos.sql
-- Añadir soporte para cuotas (installments) a los vales de nómina

ALTER TABLE KS_ADELANTOS 
ADD COLUMN AD_CUOTAS INT NOT NULL DEFAULT 1,
ADD COLUMN AD_CUOTAS_PAGADAS INT NOT NULL DEFAULT 0;
