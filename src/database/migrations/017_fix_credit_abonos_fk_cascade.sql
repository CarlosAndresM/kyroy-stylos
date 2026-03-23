-- 017_fix_credit_abonos_fk_cascade.sql
-- Añade ON DELETE CASCADE a la relación de abonos a créditos para facilitar la edición de facturas

-- 1. Eliminar la constraint anterior que no tenía cascada
ALTER TABLE KS_CREDITO_ABONOS 
DROP FOREIGN KEY FK_ABONO_CREDITO;

-- 2. Volver a crear la constraint con ON DELETE CASCADE
ALTER TABLE KS_CREDITO_ABONOS
ADD CONSTRAINT FK_ABONO_CREDITO
  FOREIGN KEY (CR_IDCREDITO_FK)
  REFERENCES KS_CREDITOS(CR_IDCREDITO_PK)
  ON DELETE CASCADE;
